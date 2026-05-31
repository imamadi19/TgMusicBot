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




class FakeJoinAfterPlayFailureClient(FakeCallClient):
    async def play(self, chat_id, file_path):
        raise RuntimeError("The userbot is not in a call")

    async def join_group_call(self, chat_id, file_path):
        await asyncio.sleep(0)
        self.calls.append(("join_group_call", chat_id, file_path))
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
        self.assertEqual(len(self.fake_call_client.calls), 1)
        action, chat_id, stream = self.fake_call_client.calls[0]
        self.assertEqual((action, chat_id), ("play", -100123))
        self.assertEqual(getattr(stream, "_media_path", None), "/tmp/next.mp3")

    async def test_play_fallback_joins_group_call_when_userbot_not_in_call(self):
        self.fake_call_client = FakeJoinAfterPlayFailureClient()
        self.adapter.call_client = self.fake_call_client

        await self.adapter.handle_stdin_command({"action": "play", "file_path": "/tmp/next.mp3"})

        self.assertTrue(self.adapter.stream_started)
        self.assertEqual(len(self.fake_call_client.calls), 1)
        action, chat_id, stream = self.fake_call_client.calls[0]
        self.assertEqual((action, chat_id), ("join_group_call", -100123))
        self.assertEqual(getattr(stream, "_media_path", None), "/tmp/next.mp3")


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
        self.assertEqual(getattr(stream, "_audio_path", None), "/tmp/next.mp4")
        self.assertIsNotNone(getattr(stream, "microphone", None))
        self.assertIsNotNone(getattr(stream, "camera", None))
        self.assertEqual(getattr(stream, "_ffmpeg_parameters", None), "--video ---start -re")
        self.assertEqual(getattr(stream, "_video_parameters", None).width, 640)
        self.assertEqual(getattr(stream, "_video_parameters", None).height, 360)
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
        self.assertEqual(len(self.fake_call_client.calls), 1)
        action, chat_id, stream = self.fake_call_client.calls[0]
        self.assertEqual((action, chat_id), ("play", -100123))
        self.assertEqual(getattr(stream, "_media_path", None), "/tmp/next.mp3")

    async def test_play_control_command_prefers_in_call_stream_switch(self):
        self.fake_call_client = FakeSwitchCallClient()
        self.adapter.call_client = self.fake_call_client
        self.adapter.stream_started = True

        await self.adapter.handle_stdin_command({"action": "play", "file_path": "/tmp/next.mp3"})

        self.assertFalse(self.adapter.paused)
        self.assertEqual(len(self.fake_call_client.calls), 1)
        action, chat_id, stream = self.fake_call_client.calls[0]
        self.assertEqual((action, chat_id), ("change_stream", -100123))
        self.assertEqual(getattr(stream, "_media_path", None), "/tmp/next.mp3")

    async def test_play_control_command_resumes_before_switching_paused_stream(self):
        self.adapter.paused = True

        await self.adapter.handle_stdin_command({"action": "replay", "file_path": "/tmp/current.mp3"})

        self.assertFalse(self.adapter.paused)
        self.assertEqual(len(self.fake_call_client.calls), 2)
        call1, call2 = self.fake_call_client.calls
        self.assertEqual(call1, ("resume", -100123))
        action, chat_id, stream = call2
        self.assertEqual((action, chat_id), ("play", -100123))
        self.assertEqual(getattr(stream, "_media_path", None), "/tmp/current.mp3")

    async def test_seek_command_uses_seek_seconds_and_volume_in_stream(self):
        await self.adapter.handle_stdin_command({
            "action": "seek",
            "file_path": "/tmp/next.mp3",
            "seek_seconds": 60,
            "volume": 50,
        })

        action, chat_id, stream = self.fake_call_client.calls[0]
        self.assertEqual((action, chat_id), ("play", -100123))
        self.assertEqual(getattr(stream, "_media_path", None), "/tmp/next.mp3")
        ffmpeg_parameters = getattr(stream, "_ffmpeg_parameters", "")
        self.assertIn("--audio ---start -ss 60", ffmpeg_parameters)
        self.assertIn("---mid -af volume=0.50", ffmpeg_parameters)

    async def test_volume_command_rebuilds_stream_at_current_seek(self):
        await self.adapter.handle_stdin_command({
            "action": "volume",
            "file_path": "/tmp/next.mp3",
            "seek_seconds": 42,
            "volume": 200,
        })

        action, chat_id, stream = self.fake_call_client.calls[0]
        self.assertEqual((action, chat_id), ("play", -100123))
        ffmpeg_parameters = getattr(stream, "_ffmpeg_parameters", "")
        self.assertIn("--audio ---start -ss 42", ffmpeg_parameters)
        self.assertIn("---mid -af volume=2.00", ffmpeg_parameters)

    async def test_seek_rejects_negative_seek_seconds(self):
        with self.assertRaisesRegex(RuntimeError, "tidak boleh negatif"):
            await self.adapter.handle_stdin_command({
                "action": "seek",
                "file_path": "/tmp/next.mp3",
                "seek_seconds": -1,
            })

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

    async def test_default_audio_stream_uses_no_ffmpeg_overrides(self):
        stream = self.adapter.media_stream_for("/tmp/next.mp3", False, 0, 100)
        self.assertIsNone(getattr(stream, "_ffmpeg_parameters", None))

    async def test_video_stream_separates_seek_and_audio_filter_segments(self):
        ffmpeg_parameters = self.adapter.ffmpeg_parameters_for_stream(seek_seconds=60, volume=50, is_video=True)
        self.assertIn("--audio ---start -ss 60", ffmpeg_parameters)
        self.assertIn("---mid -af volume=0.50", ffmpeg_parameters)
        self.assertIn("--video ---start -ss 60", ffmpeg_parameters)
        video_segment = ffmpeg_parameters.split("--video", 1)[1]
        self.assertNotIn("-af", video_segment)

    async def test_audio_stream_places_seek_in_start_and_filter_in_mid(self):
        ffmpeg_parameters = self.adapter.ffmpeg_parameters_for_stream(seek_seconds=60, volume=50, is_video=False)
        self.assertEqual(ffmpeg_parameters, "--audio ---start -ss 60 ---mid -af volume=0.50")


if __name__ == "__main__":
    unittest.main()
