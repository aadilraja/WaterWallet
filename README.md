# WaterWallet

Follow these steps **in order** to get the project up and running:

### 1. Clone the Repo

```bash
git clone https://github.com/aadilraja/WaterWallet.git
```



### 2. Install Backend Dependencies

```bash
cd ../../Backend  
python3 -m venv venv  
source venv/bin/activate       # Linux/macOS  
venv\Scripts\activate          # Windows  
pip install -r requirements.txt  

```

### 3. Run the Flask API

```bash
export FLASK_APP=app.py        # Linux/macOS  
set FLASK_APP=app.py           # Windows  
flask run --host=0.0.0.0 --port=5000  
```

Your API will be available at `http://localhost:5000`.

### 4. Install Frontend Dependencies

```bash
cd ../frontend/WaterWallet  
npm install axios              
npm install react-native-chart-kit react-native-svg                      
npm install @react-navigation/native @react-navigation/stack react-native-gesture-handler react-native-reanimated react-native-screens react-native-safe-area-context @react-native-community/masked-view  
                                
```

### 5. Configure API Base URL

Open `src/services/api.js` and set:

```js
const API_BASE = 'http://localhost:5000';
```

Ensure no duplicate `http://` prefixes.

### 6. Start the Expo Web Server

```bash
npx expo start --clear     
```

* Press **W** to open in your default browser.
* Make sure your browser can access `http://localhost:5000`.

---

