import requests


base64="""iVBORw0KGgoAAAANSUhEUgAAAGYAAAAhCAYAAAArgt62AAAAAXNSR0IArs4c6QAAAllJREFUaEPtmTtOA0EMhnckTgB0NByAKg0tZ6DnCiCBUM4QEEFwA0TPGWgoaFLRQ40EJ0Ba5JWMHDMP7zx2reykibKZnRn/3/62MzFt27ZNfUUrYIwx0Td7bjQVTJqsFUyafsXuVglm5/6kC/jr9NEZuGRMMdUGmFglGIgbhA+BcX1/MNtfk+5t9TGAlHmXUA3G5RqfWzgUKpcL0OH1cTfs9fIpr7oJs20UGAqFQsDrucAcLbY6yZ/nP1bpQ99LeKkFg+mMu0biFhsAH5wYx7jEzwEFYq5gmqapYAIePp9fNMvFzd8omzskjoEJbKmMX8eFYsDAXlfbd2spLZdbVDoG4eA7BSFpkX3FPycYmIvCQciuuiOpK3SMylRG4TzsfXb7hdZYAgbG2trl3DVm0mB4AyAFY3s6S4DhcHK5RWUqQ1FpvUEgvEOTpofc7TJdF+vKJFIZF7wPGIDA22VNYHiD43q4VNYYnxNCgbmKv+9YJqYrgz2iW2bfZ103Ke3KIAZ4YQeKn2nct1fLcY79QwLnhBM6K4sBQyHQZoW30KE4KCAVXVkKGGltoeN866WCwSagj2v43jigUVOZBjgIBYSRHmLaUlasa1TWmKHB4JP9svv+Tw+Akrof/uM4xtl4z6Qcg0FTl3CnpMDZGDA0N6c8XbH3uiBogDOqY8YGg+vbOiMORworl2smDwbdZhOeXpOCkXaCIZePDkaDa0Ii+eCFfqfQvzGk68C4CqaHWqVdQ+cvBqZHvHXogAoUOecZcP8bu1QFoxRtBVPBKFVA6baqYyoYpQoo3dYvn2j/MZiFc5AAAAAASUVORK5CYII="""


link="http://localhost:3000"
def do_post():
    request=requests.post(f"{link}/ocr",json={"img":base64})
    print(request.text)
def do_get():
    request=requests.get(link)
    print(request.text)
if __name__ == "__main__":
    do_get()
    do_post()