from flask import Flask, render_template, request, session, redirect, jsonify
import json, os, time
import requests as http
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'demo-key')

API_KEY = os.getenv('NEWS_API_KEY')
CACHE_TTL = 900
cache = {}

CAT_MAP = {
    'Technology':'technology','Sports':'sports','Politics':'nation',
    'Entertainment':'entertainment','AI':'science','All':'general'
}

# ===== DATA =====
def load_local():
    try:
        path = os.path.join(app.root_path, 'data', 'news_data.json')
        return json.load(open(path))['articles']
    except:
        return []

def fetch_news(cat='general', q=None):
    key = f"{cat}_{q}"
    if key in cache and time.time()-cache[key]['t'] < CACHE_TTL:
        return cache[key]['d']

    if not API_KEY:
        return filter_data(load_local(), cat, q)

    url = "https://gnews.io/api/v4/search" if q else "https://gnews.io/api/v4/top-headlines"
    params = {'apikey':API_KEY,'lang':'en','max':15}
    if q: params['q']=q
    else: params['category']=cat

    try:
        r = http.get(url, params=params, timeout=5).json().get('articles', [])
        data = [{
            'id': a.get('url', str(i)),
            'title': a.get('title',''),
            'summary': a.get('description',''),
            'category': cat,
            'source': a.get('source',{}).get('name',''),
            'date': (a.get('publishedAt') or '')[:10],
            'img': a.get('image',''),
            'url': a.get('url','#')
        } for i,a in enumerate(r)]

        if data:
            cache[key] = {'t':time.time(),'d':data}
            return data

    except:
        pass

    return filter_data(load_local(), cat, q)

def filter_data(data, cat, q):
    if q:
        q = q.lower()
        return [a for a in data if q in a['title'].lower()]
    return data if cat=='general' else [a for a in data if a['category'].lower().startswith(cat[:3])]

# ===== ROUTES =====
@app.route('/')
def home(): return render_template('index.html')

@app.route('/category/<c>')
def category(c): return render_template('category.html', category=c)

@app.route('/search')
def search(): return render_template('search.html', query=request.args.get('q',''))

@app.route('/bookmarks')
def bookmarks(): return render_template('bookmarks.html')

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method=='POST':
        session['user'] = request.form.get('username') or 'Guest'
        return redirect('/')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

# ===== API =====
@app.route('/api/news')
def api_news():
    cat = request.args.get('category','All')
    return jsonify({'articles': fetch_news(CAT_MAP.get(cat,'general'))})

@app.route('/api/search')
def api_search():
    q = request.args.get('q','')
    return jsonify({'articles': fetch_news('general', q)})

@app.route('/api/like', methods=['POST'])
def like(): return jsonify({'ok':True})

@app.route('/api/bookmark', methods=['POST'])
def bookmark(): return jsonify({'ok':True})

@app.route('/api/preferences', methods=['POST'])
def pref(): return jsonify({'ok':True})

if __name__ == '__main__':
    app.run(debug=True)