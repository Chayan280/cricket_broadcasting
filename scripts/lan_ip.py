"""Prints the URLs other laptops should open.   python scripts/lan_ip.py"""
import socket

s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    s.connect(("10.255.255.255", 1))
    ip = s.getsockname()[0]
except OSError:
    ip = "127.0.0.1"
finally:
    s.close()

print(f"Your LAN IP: {ip}\n")
print(f"Scorer (admin) : http://{ip}:5173/admin")
print(f"Commentator    : http://{ip}:5173/charts/<match-id>")
print(f"Scoreboard     : http://{ip}:5173/scoreboard/<match-id>?bg=transparent")
print(f"Chart overlay  : http://{ip}:5173/overlay/<match-id>")
print(f"API health     : http://{ip}:8000/api/health   (API docs: http://{ip}:8000/docs)")
