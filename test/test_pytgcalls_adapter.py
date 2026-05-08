import asyncio
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest


ADAPTER_PATH = Path(__file__).resolve().parents[1] / "scripts" / "pytgcalls_adapter.py"


class FakeCallClient:
    def __init__(self):
        self.calls = []

    async def pause(self, chat_id):
        await asyncio.sleep(0)
        self.calls.append(("pause", chat_id))
        return True

    async def resume(self, chat_id):
        await asyncio.sleep(0)
        self.calls.append(("resume", chat_id))
        return True

    async def play(self, chat_id, file_path):
        await asyncio.sleep(0)
        self.calls.append(("play", chat_id, file_path))
        return True


class FakeSwitchCallClient(FakeCallClient):
    async def change_stream(self, chat_id, file_path):
        await asyncio.sleep(0)
        self.calls.append(("change_stream", chat_id, file_path))
        return True


class FakeChatAccessClient:
    def __init__(self, *, chat=None, get_chat_error=None, dialogs=None):
        self.chat = chat
        self.get_chat_error = get_chat_error
        self.dialogs = dialogs or []
        self.get_chat_calls = []
        self.join_chat_calls = []

    async def get_chat(self, chat_id):
        self.get_chat_calls.append(chat_id)
        if self.get_chat_error is not None:
            raise self.get_chat_error
        return self.chat

    def get_dialogs(self):
        return self.dialogs

    async def join_chat(self, invite_link):
        self.join_chat_calls.append(invite_link)
        return True


class AdapterControlSignalTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        spec = importlib.util.spec_from_file_location("pytgcalls_adapter_under_test", ADAPTER_PATH)
        self.adapter = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.adapter)
        self.loop = asyncio.get_running_loop()
        self.fake_call_client = FakeCallClient()
        self.adapter.event_loop = self.loop
        self.adapter.call_client = self.fake_call_client
        self.adapter.chat_id = -100123
        self.adapter.paused = False
        self.adapter.stream_started = False
        self.adapter.current_stream_is_video = False

    async def test_pause_and_resume_schedule_async_pytgcalls_methods(self):
        self.adapter.pause()
        await asyncio.sleep(0.05)
        self.assertTrue(self.adapter.paused)

        self.adapter.resume()
        await asyncio.sleep(0.05)
        self.assertFalse(self.adapter.paused)
        self.assertEqual(
            self.fake_call_client.calls,
            [("pause", -100123), ("resume", -100123)],
        )

    async def test_play_control_command_starts_stream_when_no_stream_exists_yet(self):
        await self.adapter.handle_stdin_command({"action": "play", "file_path": "/tmp/next.mp3"})

        self.assertFalse(self.adapter.paused)
        self.assertTrue(self.adapter.stream_started)
        self.assertEqual(
            self.fake_call_client.calls,
            [("play", -100123, "/tmp/next.mp3")],
        )

    async def test_video_play_control_command_uses_media_stream(self):
        await self.adapter.handle_stdin_command({
            "action": "play",
            "file_path": "/tmp/next.mp4",
            "is_video": True,
        })

        self.assertFalse(self.adapter.paused)
        self.assertTrue(self.adapter.stream_started)
        self.assertTrue(self.adapter.current_stream_is_video)
        self.assertEqual(len(self.fake_call_client.calls), 1)
        action, chat_id, stream = self.fake_call_client.calls[0]
        self.assertEqual((action, chat_id), ("play", -100123))
        self.assertEqual(getattr(stream, "_media_path", None), "/tmp/next.mp4")
        self.assertIsNotNone(getattr(stream, "camera", None))
        self.assertEqual(getattr(stream, "_ffmpeg_parameters", None), "---start -re")
        self.assertEqual(getattr(stream, "_video_parameters", None).width, 1280)
        self.assertEqual(getattr(stream, "_video_parameters", None).height, 720)
        self.assertEqual(getattr(stream, "_video_parameters", None).frame_rate, 30)

    async def test_video_quality_env_can_lower_resolution(self):
        import os

        old_quality = os.environ.get("VOICE_VIDEO_QUALITY")
        os.environ["VOICE_VIDEO_QUALITY"] = "480p"
        try:
            stream = self.adapter.media_stream_for("/tmp/next.mp4", True)
        finally:
            if old_quality is None:
                os.environ.pop("VOICE_VIDEO_QUALITY", None)
            else:
                os.environ["VOICE_VIDEO_QUALITY"] = old_quality

        self.assertEqual(getattr(stream, "_video_parameters", None).width, 854)
        self.assertEqual(getattr(stream, "_video_parameters", None).height, 480)
        self.assertEqual(getattr(stream, "_video_parameters", None).frame_rate, 30)

    async def test_video_realtime_can_be_disabled_for_custom_adapters(self):
        import os

        old_value = os.environ.get("VOICE_VIDEO_REALTIME")
        os.environ["VOICE_VIDEO_REALTIME"] = "0"
        try:
            stream = self.adapter.media_stream_for("/tmp/next.mp4", True)
        finally:
            if old_value is None:
                os.environ.pop("VOICE_VIDEO_REALTIME", None)
            else:
                os.environ["VOICE_VIDEO_REALTIME"] = old_value

        self.assertIsNone(getattr(stream, "_ffmpeg_parameters", None))

    async def test_string_false_video_flag_stays_audio_only(self):
        await self.adapter.handle_stdin_command({
            "action": "play",
            "file_path": "/tmp/next.mp3",
            "is_video": "0",
        })

        self.assertFalse(self.adapter.current_stream_is_video)
        self.assertEqual(
            self.fake_call_client.calls,
            [("play", -100123, "/tmp/next.mp3")],
        )

    async def test_play_control_command_prefers_in_call_stream_switch(self):
        self.fake_call_client = FakeSwitchCallClient()
        self.adapter.call_client = self.fake_call_client
        self.adapter.stream_started = True

        await self.adapter.handle_stdin_command({"action": "play", "file_path": "/tmp/next.mp3"})

        self.assertFalse(self.adapter.paused)
        self.assertEqual(
            self.fake_call_client.calls,
            [("change_stream", -100123, "/tmp/next.mp3")],
        )

    async def test_play_control_command_resumes_before_switching_paused_stream(self):
        self.adapter.paused = True

        await self.adapter.handle_stdin_command({"action": "replay", "file_path": "/tmp/current.mp3"})

        self.assertFalse(self.adapter.paused)
        self.assertEqual(
            self.fake_call_client.calls,
            [("resume", -100123), ("play", -100123, "/tmp/current.mp3")],
        )

    async def test_existing_chat_skips_invite_links(self):
        chat = SimpleNamespace(id=-100123)
        client = FakeChatAccessClient(chat=chat)

        existing_chat = await self.adapter.ensure_target_chat_ready(client, -100123, ["https://t.me/+invite"])

        self.assertIs(existing_chat, chat)
        self.assertEqual(client.get_chat_calls, [-100123])
        self.assertEqual(client.join_chat_calls, [])

    async def test_dialog_match_skips_invite_when_get_chat_fails(self):
        chat = SimpleNamespace(id=-100123)
        client = FakeChatAccessClient(
            get_chat_error=RuntimeError("CHANNEL_INVALID"),
            dialogs=[SimpleNamespace(chat=chat)],
        )

        existing_chat = await self.adapter.ensure_target_chat_ready(client, -100123, ["https://t.me/+invite"])

        self.assertIs(existing_chat, chat)
        self.assertEqual(client.join_chat_calls, [])

    async def test_missing_chat_uses_invite_link(self):
        client = FakeChatAccessClient(get_chat_error=RuntimeError("CHANNEL_INVALID"))

        existing_chat = await self.adapter.ensure_target_chat_ready(client, -100123, ["https://t.me/+invite"])

        self.assertIsNone(existing_chat)
        self.assertEqual(client.join_chat_calls, ["https://t.me/+invite"])


if __name__ == "__main__":
    unittest.main()
