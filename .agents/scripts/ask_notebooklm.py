#!/usr/bin/env python3
"""Query a NotebookLM notebook and print the answer to stdout.

Usage:
    python .agents/scripts/ask_notebooklm.py <notebook_id> "<question>"
"""
import asyncio, sys


async def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: ask_notebooklm.py <notebook_id> \"<question>\"", file=sys.stderr)
        sys.exit(1)
    notebook_id, question = sys.argv[1], sys.argv[2]
    try:
        from notebooklm import NotebookLMClient
    except ImportError:
        print("Error: run: pip install notebooklm-py && playwright install chromium", file=sys.stderr)
        sys.exit(2)
    try:
        async with await NotebookLMClient.from_storage() as client:
            result = await client.chat.ask(notebook_id, question)
            print(result.answer)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    asyncio.run(main())
