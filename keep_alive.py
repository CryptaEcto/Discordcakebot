from flask import Flask
from threading import Thread

app = Flask('')

@app.route('/')
def home():
    return "Cake Party Bot is alive and ready to bake!"

def run():
    app.run(host='0.0.0.0', port=8080)

def keep_alive():
    t = Thread(target=run)
    t.start()