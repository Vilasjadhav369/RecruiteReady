#!/usr/bin/env python3
"""
with_server.py — Manage server lifecycles for web application testing with Playwright.

Starts one or more servers, polls their ports until ready, runs the test command,
and guarantees clean termination of all server processes upon completion.
"""

import argparse
import socket
import subprocess
import sys
import time
import os
import signal

def is_server_ready(port, host='localhost', timeout=30):
    """Wait for server to be ready by polling the port."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except (socket.error, ConnectionRefusedError, OSError):
            time.sleep(0.5)
    return False

def terminate_process(proc):
    """Cleanly terminate a subprocess across platforms."""
    if proc.poll() is not None:
        return
    try:
        if sys.platform == 'win32':
            subprocess.run(['taskkill', '/F', '/T', '/PID', str(proc.pid)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
    except Exception:
        try:
            proc.terminate()
            proc.wait(timeout=3)
        except Exception:
            proc.kill()

def main():
    parser = argparse.ArgumentParser(
        description='Run command with one or more background servers'
    )
    parser.add_argument(
        '--server',
        action='append',
        dest='servers',
        required=True,
        help='Server command to start (e.g. "npm run dev")',
    )
    parser.add_argument(
        '--port',
        action='append',
        dest='ports',
        type=int,
        required=True,
        help='Port to poll for readiness for each server',
    )
    parser.add_argument(
        '--timeout',
        type=int,
        default=30,
        help='Timeout in seconds to wait for each server to be ready (default: 30)',
    )
    parser.add_argument(
        'command',
        nargs=argparse.REMAINDER,
        help='Test command to execute once all servers are ready',
    )

    args = parser.parse_args()

    if len(args.servers) != len(args.ports):
        print(f"Error: Number of --server ({len(args.servers)}) must match number of --port ({len(args.ports)})", file=sys.stderr)
        sys.exit(1)

    cmd = args.command
    if cmd and cmd[0] == '--':
        cmd = cmd[1:]

    if not cmd:
        print("Error: No test command specified to run.", file=sys.stderr)
        sys.exit(1)

    server_procs = []
    try:
        # Start all servers
        for server_cmd, port in zip(args.servers, args.ports):
            print(f"[with_server] Starting server on port {port}: {server_cmd}")
            proc = subprocess.Popen(
                server_cmd,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
            server_procs.append((proc, port, server_cmd))

        # Wait for all servers to become ready
        for proc, port, server_cmd in server_procs:
            print(f"[with_server] Waiting for port {port} to become ready (timeout {args.timeout}s)...")
            if not is_server_ready(port, timeout=args.timeout):
                print(f"[with_server] ERROR: Server on port {port} failed to start within {args.timeout}s.", file=sys.stderr)
                sys.exit(1)
            print(f"[with_server] Port {port} is ready!")

        # Execute test command
        print(f"[with_server] Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd)
        sys.exit(result.returncode)

    finally:
        print("[with_server] Shutting down server processes...")
        for proc, port, server_cmd in server_procs:
            terminate_process(proc)
        print("[with_server] All servers terminated.")

if __name__ == '__main__':
    main()
