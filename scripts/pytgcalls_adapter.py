#!/usr/bin/env python3
"""PyTgCalls voice adapter for TgMusicBot.

The Node.js player starts this process for one chat/track and passes all
configuration through environment variables. The process prints TGMB_READY after
it successfully joins the Telegram group call and starts streaming the file.
"""

from __future__ import annotations

import asyncio
import inspect
import json
import os
import signal
import sys
import threading
import traceback
from pyrogram.raw import functions, types

READY_MARKER = "TGMB_READY"

stop_event = threading.Event()
async_stop_event = None
event_loop = None
paused = False
call_client = None
chat_id = None
client = None
stream_started = False
current_stream_is_video = False


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} belum diisi")
    return value


async def maybe_await(value):
    if inspect.isawaitable(value):
        return await value
    return value


async def call_method(method, *args):
    return await maybe_await(method(*args))


async def call_method_with_optional_chat(method):
    try:
        return await call_method(method, chat_id)
    except TypeError:
        return await call_method(method)


async def call_method_with_optional_chat_and_stream(method, stream):
    try:
        return await call_method(method, chat_id, stream)
    except TypeError:
        return await call_method(method, stream)


async def maybe_call_async(obj, *names):
    for name in names:
        method = getattr(obj, name, None)
        if callable(method):
            return await call_method(method)
    return None


def log_control_error(action: str, future):
    try:
        future.result()
    except Exception as exc:  # noqa: BLE001 - signal callbacks must not crash the adapter.
        print(f"VOICE_ADAPTER_WARN: gagal {action}: {exc}", file=sys.stderr, flush=True)


def schedule_control(action: str, coroutine):
    if event_loop is None or not event_loop.is_running():
        coroutine.close()
        return
    future = asyncio.run_coroutine_threadsafe(coroutine, event_loop)
    future.add_done_callback(lambda done: log_control_error(action, done))


def cleanup(*_args):
    stop_event.set()
    if event_loop is not None and event_loop.is_running() and async_stop_event is not None:
        event_loop.call_soon_threadsafe(async_stop_event.set)


async def pause_async():
    global paused
    if call_client is None or chat_id is None or paused:
        return
    paused = True
    for name in ("pause", "pause_stream"):
        method = getattr(call_client, name, None)
        if callable(method):
            await call_method_with_optional_chat(method)
            break


def pause(*_args):
    schedule_control("pause", pause_async())


async def resume_async():
    global paused
    if call_client is None or chat_id is None:
        return
    paused = False
    for name in ("resume", "resume_stream"):
        method = getattr(call_client, name, None)
        if callable(method):
            await call_method_with_optional_chat(method)
            break


def resume(*_args):
    schedule_control("resume", resume_async())


async def switch_stream_in_current_call(stream) -> bool:
    """Switch media source without asking PyTgCalls to join the call again.

    PyTgCalls releases expose different method names for in-call source
    replacement. Prefer those methods when available so queue transitions and
    manual skips keep the assistant in the existing group call instead of
    leaving and rejoining between songs.
    """
    for name in ("change_stream", "change_stream_source", "change_stream_sources", "set_stream", "set_stream_source"):
        method = getattr(call_client, name, None)
        if not callable(method):
            continue
        await call_method_with_optional_chat_and_stream(method, stream)
        return True
    return False


def bool_value(value, fallback: bool = False) -> bool:
    if value is None:
        return fallback
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text == "":
        return fallback
    return text in {"1", "true", "yes", "on"}


def env_flag(name: str, fallback: bool = False) -> bool:
    return bool_value(os.environ.get(name), fallback)


def media_stream_for(file_path: str, is_video: bool):
    if not is_video:
        return file_path

    from pytgcalls.types import MediaStream
    from pytgcalls.types.stream import AudioQuality, VideoQuality

    return MediaStream(
        file_path,
        audio_parameters=AudioQuality.HIGH,
        video_parameters=VideoQuality.FHD_1080p,
        audio_flags=MediaStream.Flags.REQUIRED,
        video_flags=MediaStream.Flags.REQUIRED,
    )


async def play_file_async(file_path: str, is_video: bool = False):
    global paused, stream_started, current_stream_is_video
    if call_client is None or chat_id is None:
        raise RuntimeError("voice call belum aktif")
    if not file_path:
        raise RuntimeError("file_path kosong")
    stream = media_stream_for(file_path, is_video)
    if paused:
        await resume_async()
    if stream_started and current_stream_is_video == is_video and await switch_stream_in_current_call(stream):
        paused = False
        return
    await call_method(call_client.play, chat_id, stream)
    stream_started = True
    current_stream_is_video = is_video
    paused = False


async def handle_stdin_command(command: dict):
    action = str(command.get("action", "")).strip().lower()
    command_id = str(command.get("id", "")).strip() or "-"
    if action in {"play", "replay", "switch"}:
        await play_file_async(str(command.get("file_path", "")), bool_value(command.get("is_video")))
        print(f"TGMB_CONTROL_OK {command_id} play", flush=True)
        return
    if action == "pause":
        await pause_async()
        print(f"TGMB_CONTROL_OK {command_id} pause", flush=True)
        return
    if action == "resume":
        await resume_async()
        print(f"TGMB_CONTROL_OK {command_id} resume", flush=True)
        return
    if action == "stop":
        cleanup()
        print(f"TGMB_CONTROL_OK {command_id} stop", flush=True)
        return
    raise RuntimeError(f"command tidak dikenal: {action}")


async def stdin_command_loop():
    while not stop_event.is_set():
        line = await asyncio.to_thread(sys.stdin.readline)
        if line == "":
            return
        line = line.strip()
        if not line:
            continue
        command_id = "-"
        try:
            command = json.loads(line)
            if not isinstance(command, dict):
                raise ValueError("command harus object JSON")
            command_id = str(command.get("id", "")).strip() or "-"
            await handle_stdin_command(command)
        except Exception as exc:  # noqa: BLE001 - control channel must keep running.
            print(f"TGMB_CONTROL_ERROR {command_id} {exc}", file=sys.stderr, flush=True)
            print(f"VOICE_ADAPTER_WARN: gagal memproses command stdin: {exc}", file=sys.stderr, flush=True)


def patch_pyrogram_groupcall_error() -> None:
    """Add the error alias expected by some PyTgCalls builds.

    Recent plain Pyrogram releases do not export ``GroupcallForbidden`` while
    several PyTgCalls releases import that exact name during client startup.
    Falling back to Pyrogram's generic ``Forbidden`` RPC error keeps the import
    compatible; PyTgCalls only needs the class to catch a forbidden group-call
    response and clear its call cache.
    """
    try:
        import pyrogram.errors as pyrogram_errors
    except ImportError:
        return

    if hasattr(pyrogram_errors, "GroupcallForbidden"):
        return

    fallback = (
        getattr(pyrogram_errors, "GroupCallForbidden", None)
        or getattr(pyrogram_errors, "Forbidden", None)
        or RuntimeError
    )
    setattr(pyrogram_errors, "GroupcallForbidden", fallback)

    exceptions_module = getattr(pyrogram_errors, "exceptions", None)
    if exceptions_module is not None and not hasattr(exceptions_module, "GroupcallForbidden"):
        setattr(exceptions_module, "GroupcallForbidden", fallback)


def patch_pyrogram_large_chat_ids() -> None:
    """Teach older Pyrogram builds to accept newer large supergroup IDs.

    Telegram supergroup/channel Bot API IDs use the ``-100...`` prefix. Some
    Pyrogram/PyrogramMod versions still validate the inner channel id as a
    32-bit number, so newer chats such as ``-1003872810522`` are rejected by
    ``utils.get_peer_type`` before Pyrogram can resolve them from the assistant
    account. PyTgCalls calls that resolver internally, so patch the local
    utility function to classify every ``-100`` id as a channel.
    """
    try:
        import pyrogram.utils as pyrogram_utils
    except ImportError:
        return

    original_get_peer_type = getattr(pyrogram_utils, "get_peer_type", None)
    already_patched = getattr(original_get_peer_type, "_tgmb_large_id_patch", False)
    if not callable(original_get_peer_type) or already_patched:
        return

    def get_peer_type(peer_id):
        try:
            return original_get_peer_type(peer_id)
        except ValueError as exc:
            try:
                numeric_peer_id = int(peer_id)
            except (TypeError, ValueError):
                raise exc
            if str(numeric_peer_id).startswith("-100"):
                return "channel"
            raise exc

    get_peer_type._tgmb_large_id_patch = True
    pyrogram_utils.get_peer_type = get_peer_type


def same_chat_id(value, target_chat_id: int) -> bool:
    try:
        return int(value) == int(target_chat_id)
    except (TypeError, ValueError):
        return False


def chat_from_dialog(dialog):
    return getattr(dialog, "chat", dialog)


async def find_dialog_chat(client, target_chat_id: int):
    get_dialogs = getattr(client, "get_dialogs", None)
    if not callable(get_dialogs):
        return None

    dialogs = get_dialogs()
    if inspect.isawaitable(dialogs):
        dialogs = await dialogs

    if hasattr(dialogs, "__aiter__"):
        async for dialog in dialogs:
            chat = chat_from_dialog(dialog)
            if same_chat_id(getattr(chat, "id", None), target_chat_id):
                return chat
        return None

    for dialog in dialogs or []:
        chat = chat_from_dialog(dialog)
        if same_chat_id(getattr(chat, "id", None), target_chat_id):
            return chat
    return None


async def get_existing_target_chat(client, target_chat_id: int):
    try:
        chat = await call_method(client.get_chat, target_chat_id)
        print("TGMB_ASSISTANT_ALREADY_IN_CHAT", flush=True)
        return chat
    except Exception:
        pass

    chat = await find_dialog_chat(client, target_chat_id)
    if chat is not None:
        print("TGMB_ASSISTANT_ALREADY_IN_CHAT", flush=True)
        return chat
    return None


async def ensure_target_chat_ready(client, target_chat_id: int, invite_links: list[str]):
    existing_chat = await get_existing_target_chat(client, target_chat_id)
    if existing_chat is not None:
        return existing_chat
    await join_from_invite_links(client, invite_links)
    return None


def describe_adapter_error(exc: Exception) -> tuple[str, bool]:
    """Return a short user-facing message and whether traceback is useful."""
    text = " ".join(str(exc).split())
    lowered = text.lower()

    if "bot_method_invalid" in lowered or "phone.creategroupcall" in lowered:
        return (
            "STRING1/SESSION_STRINGS harus berisi session string akun user assistant, "
            "bukan bot token/session bot. Buat ulang STRING1 dari akun Telegram biasa, "
            "tambahkan akun assistant itu ke grup, lalu mulai voice/video chat sebelum /play.",
            False,
        )
    if "assistant login terdeteksi sebagai bot" in lowered:
        return (text, False)
    if "peer id invalid" in lowered or "could not find the input entity" in lowered:
        return (
            "Assistant belum bisa menemukan grup. Pastikan akun assistant sudah join grup, "
            "pernah membuka chat grup tersebut, dan bot menerima chat_id grup yang benar.",
            False,
        )
    if "groupcallforbidden" in lowered or "forbidden" in lowered:
        return (
            "Assistant tidak punya izin voice chat. Jadikan assistant member/admin yang boleh join voice chat, "
            "lalu pastikan voice/video chat grup sedang aktif.",
            False,
        )
    if "no active group call" in lowered or "groupcallnotmodified" in lowered:
        return (
            "Voice/video chat grup belum aktif. Mulai obrolan suara/video di grup dulu, lalu ulangi /play.",
            False,
        )
    if isinstance(exc, RuntimeError):
        return (text, False)
    return (text, True)


def parse_invite_links() -> list[str]:
    links_json = os.environ.get("TGMB_INVITE_LINKS", "").strip()
    legacy_link = os.environ.get("TGMB_INVITE_LINK", "").strip()
    links: list[str] = []

    if links_json:
        try:
            parsed = json.loads(links_json)
            if isinstance(parsed, list):
                links.extend(str(link).strip() for link in parsed)
            elif isinstance(parsed, str):
                links.append(parsed.strip())
        except json.JSONDecodeError:
            links.extend(part.strip() for part in links_json.replace(",", "\n").splitlines())

    if legacy_link:
        links.append(legacy_link)

    unique_links: list[str] = []
    for link in links:
        if link and link not in unique_links:
            unique_links.append(link)
    return unique_links


async def join_from_invite(client, invite_link: str) -> bool:
    if not invite_link:
        return False
    try:
        await call_method(client.join_chat, invite_link)
        print("TGMB_ASSISTANT_JOINED", flush=True)
        return True
    except Exception as exc:  # noqa: BLE001 - assistant may already be a member.
        text = " ".join(str(exc).split()).lower()
        already_joined_markers = (
            "user_already_participant",
            "already a participant",
            "already participant",
            "already joined",
        )
        if any(marker in text for marker in already_joined_markers):
            return True
        print(
            f"VOICE_ADAPTER_WARN: gagal join assistant lewat invite link: {exc}. "
            "Mencoba link invite cadangan jika tersedia.",
            file=sys.stderr,
            flush=True,
        )
        return False


async def join_from_invite_links(client, invite_links: list[str]) -> None:
    if not invite_links:
        return
    for invite_link in invite_links:
        if await join_from_invite(client, invite_link):
            return
    print(
        "VOICE_ADAPTER_WARN: semua link invite gagal dipakai. "
        "Jika assistant belum ada di grup, pastikan bot admin atau link grup masih valid.",
        file=sys.stderr,
        flush=True,
    )


async def leave_target_chat(client, target_chat_id: int) -> None:
    try:
        await call_method(client.leave_chat, target_chat_id)
        print("TGMB_ASSISTANT_LEFT_CHAT", flush=True)
    except Exception as exc:  # noqa: BLE001 - leaving is a best-effort cleanup.
        print(f"VOICE_ADAPTER_WARN: gagal keluar dari grup {target_chat_id}: {exc}", file=sys.stderr, flush=True)


async def warm_peer_cache(client, target_chat_id: int, known_chat=None) -> None:
    """Resolve the target chat once before PyTgCalls starts streaming.

    PyTgCalls eventually asks Pyrogram to resolve ``target_chat_id``. Resolving
    it here gives Pyrogram a chance to populate its peer storage and lets us
    show a clear warning if the assistant has not joined the group yet.
    """
    if known_chat is not None:
        return
    try:
        await call_method(client.get_chat, target_chat_id)
    except Exception as exc:  # noqa: BLE001 - keep adapter startup best-effort.
        print(
            f"VOICE_ADAPTER_WARN: gagal resolve chat {target_chat_id}: {exc}. "
            "Pastikan assistant sudah join grup dan obrolan video aktif.",
            file=sys.stderr,
            flush=True,
        )


async def mute_target_chat_notifications(client, target_chat_id: int) -> None:
    """Mute the target group for the assistant account to avoid noisy joins."""
    try:
        peer = await call_method(client.resolve_peer, target_chat_id)
        await call_method(
            client.invoke,
            functions.account.UpdateNotifySettings(
                peer=types.InputNotifyPeer(peer=peer),
                settings=types.InputPeerNotifySettings(mute_until=2_147_483_647),
            ),
        )
        print("TGMB_ASSISTANT_MUTED_CHAT", flush=True)
    except Exception as exc:  # noqa: BLE001 - muting notifications is best-effort.
        print(f"VOICE_ADAPTER_WARN: gagal mute notifikasi grup {target_chat_id}: {exc}", file=sys.stderr, flush=True)


async def main_async() -> int:
    global call_client, chat_id, client, async_stop_event
    async_stop_event = asyncio.Event()

    api_id = int(require_env("TGMB_API_ID"))
    api_hash = require_env("TGMB_API_HASH")
    session_type = os.environ.get("TGMB_SESSION_TYPE", "pyrogram").strip().lower()
    session_string = require_env("TGMB_SESSION_STRING")
    chat_id = int(require_env("TGMB_CHAT_ID"))
    assistant_index = os.environ.get("TGMB_ASSISTANT_INDEX", "?").strip() or "?"
    action = os.environ.get("TGMB_ACTION", "play").strip().lower()
    file_path = os.environ.get("TGMB_FILE_PATH", "").strip()
    is_video = env_flag("TGMB_IS_VIDEO")
    invite_links = parse_invite_links()

    if session_type != "pyrogram":
        raise RuntimeError("Adapter bawaan hanya mendukung SESSION_TYPE=pyrogram")
    if action == "play" and not file_path:
        raise RuntimeError("TGMB_FILE_PATH belum diisi")
    if action == "play" and not os.path.exists(file_path):
        raise RuntimeError(f"File tidak ditemukan: {file_path}")

    patch_pyrogram_groupcall_error()
    patch_pyrogram_large_chat_ids()

    from pyrogram import Client
    from pytgcalls import PyTgCalls

    client = Client(
        name="tgmb-assistant",
        api_id=api_id,
        api_hash=api_hash,
        session_string=session_string,
        in_memory=True,
    )
    client_started = False
    try:
        await call_method(client.start)
        client_started = True
        assistant = await call_method(client.get_me)
        assistant_name = getattr(assistant, "username", None) or getattr(assistant, "first_name", None) or getattr(assistant, "id", "unknown")
        print(f"TGMB_ASSISTANT_SELECTED assistant={assistant_index} account={assistant_name}", flush=True)
        if getattr(assistant, "is_bot", False):
            raise RuntimeError(
                "Assistant login terdeteksi sebagai bot. STRING1 wajib dibuat dari akun user Telegram, "
                "bukan TOKEN bot dari BotFather."
            )
        if action == "leave_chat":
            await leave_target_chat(client, chat_id)
            return 0
        if action not in {"play", "join_chat"}:
            raise RuntimeError(f"TGMB_ACTION tidak dikenal: {action}")

        existing_chat = await ensure_target_chat_ready(client, chat_id, invite_links)
        await warm_peer_cache(client, chat_id, existing_chat)
        await mute_target_chat_notifications(client, chat_id)
        if action == "join_chat":
            print(READY_MARKER, flush=True)
            return 0

        call_client = PyTgCalls(client)
        await maybe_call_async(call_client, "start")
        await play_file_async(file_path, is_video)
        print(READY_MARKER, flush=True)

        command_task = asyncio.create_task(stdin_command_loop())
        try:
            await async_stop_event.wait()
        finally:
            command_task.cancel()
            await asyncio.gather(command_task, return_exceptions=True)
    finally:
        if call_client is not None:
            for name in ("leave_call", "leave_group_call"):
                method = getattr(call_client, name, None)
                if callable(method):
                    await call_method_with_optional_chat(method)
                    break
            await maybe_call_async(call_client, "stop")
        if client_started:
            await call_method(client.stop)
    return 0


def main() -> int:
    global event_loop
    event_loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(event_loop)
        return event_loop.run_until_complete(main_async())
    finally:
        event_loop.close()
        event_loop = None


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, cleanup)
    signal.signal(signal.SIGINT, cleanup)
    if hasattr(signal, "SIGUSR1"):
        signal.signal(signal.SIGUSR1, pause)
    if hasattr(signal, "SIGUSR2"):
        signal.signal(signal.SIGUSR2, resume)
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001 - surface adapter failures to Node.
        message, include_traceback = describe_adapter_error(exc)
        print(f"VOICE_ADAPTER_ERROR: {message}", file=sys.stderr, flush=True)
        if include_traceback:
            traceback.print_exc(file=sys.stderr)
        raise SystemExit(1)
