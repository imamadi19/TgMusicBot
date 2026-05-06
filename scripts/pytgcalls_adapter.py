#!/usr/bin/env python3
"""PyTgCalls voice adapter for TgMusicBot.

The Node.js player starts this process for one chat/track and passes all
configuration through environment variables. The process prints TGMB_READY after
it successfully joins the Telegram group call and starts streaming the file.
"""

from __future__ import annotations

import os
import signal
import sys
import threading
import traceback

READY_MARKER = "TGMB_READY"

stop_event = threading.Event()
paused = False
call_client = None
chat_id = None


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} belum diisi")
    return value


def maybe_call(obj, *names):
    for name in names:
        method = getattr(obj, name, None)
        if callable(method):
            return method()
    return None


def cleanup(*_args):
    stop_event.set()


def toggle_pause(*_args):
    global paused
    if call_client is None or chat_id is None:
        return
    paused = not paused
    method_names = ("pause", "pause_stream") if paused else ("resume", "resume_stream")
    for name in method_names:
        method = getattr(call_client, name, None)
        if callable(method):
            try:
                method(chat_id)
            except TypeError:
                method()
            break


def resume(*_args):
    global paused
    if call_client is None or chat_id is None:
        return
    paused = False
    for name in ("resume", "resume_stream"):
        method = getattr(call_client, name, None)
        if callable(method):
            try:
                method(chat_id)
            except TypeError:
                method()
            break


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


def main() -> int:
    global call_client, chat_id

    api_id = int(require_env("TGMB_API_ID"))
    api_hash = require_env("TGMB_API_HASH")
    session_type = os.environ.get("TGMB_SESSION_TYPE", "pyrogram").strip().lower()
    session_string = require_env("TGMB_SESSION_STRING")
    chat_id = int(require_env("TGMB_CHAT_ID"))
    file_path = require_env("TGMB_FILE_PATH")

    if session_type != "pyrogram":
        raise RuntimeError("Adapter bawaan hanya mendukung SESSION_TYPE=pyrogram")
    if not os.path.exists(file_path):
        raise RuntimeError(f"File tidak ditemukan: {file_path}")

    patch_pyrogram_groupcall_error()

    from pyrogram import Client
    from pytgcalls import PyTgCalls

    client = Client(
        name="tgmb-assistant",
        api_id=api_id,
        api_hash=api_hash,
        session_string=session_string,
        in_memory=True,
    )
    client.start()

    call_client = PyTgCalls(client)
    maybe_call(call_client, "start")
    call_client.play(chat_id, file_path)
    print(READY_MARKER, flush=True)

    stop_event.wait()

    for name in ("leave_call", "leave_group_call"):
        method = getattr(call_client, name, None)
        if callable(method):
            try:
                method(chat_id)
            except TypeError:
                method()
            break
    maybe_call(call_client, "stop")
    client.stop()
    return 0


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, cleanup)
    signal.signal(signal.SIGINT, cleanup)
    if hasattr(signal, "SIGUSR1"):
        signal.signal(signal.SIGUSR1, toggle_pause)
    if hasattr(signal, "SIGUSR2"):
        signal.signal(signal.SIGUSR2, resume)
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001 - surface adapter failures to Node.
        print(f"VOICE_ADAPTER_ERROR: {exc}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        raise SystemExit(1)
