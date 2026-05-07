import asyncio
import importlib.util
from pathlib import Path
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

    async def test_play_control_command_switches_stream_in_same_call(self):
        await self.adapter.handle_stdin_command({"action": "play", "file_path": "/tmp/next.mp3"})

        self.assertFalse(self.adapter.paused)
        self.assertEqual(
            self.fake_call_client.calls,
            [("play", -100123, "/tmp/next.mp3")],
        )

    async def test_play_control_command_resumes_before_switching_paused_stream(self):
        self.adapter.paused = True

        await self.adapter.handle_stdin_command({"action": "replay", "file_path": "/tmp/current.mp3"})

        self.assertFalse(self.adapter.paused)
        self.assertEqual(
            self.fake_call_client.calls,
            [("resume", -100123), ("play", -100123, "/tmp/current.mp3")],
        )


if __name__ == "__main__":
    unittest.main()
