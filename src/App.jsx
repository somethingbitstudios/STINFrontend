import React, { useState, useEffect } from 'react';
import { useTranslation, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import './App.css';

// --- NASTAVENÍ PŘEKLADŮ (i18n) ---
i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        title: "Currency Analytics",
        baseCurrency: "Base Currency:",
        compareCurrencies: "Compare with (Multi-select):",
        dateFrom: "Date From:",
        dateTo: "Date To:",
        calculateBtn: "Calculate",
        results: "Results",
        results2: "Data from timespan",
        average: "Average Rate",
        average2: "Average Rates for each currency in timespan",
        average3: "Average rate",
        strongest: "Strongest Rate",
        weakest: "Weakest Rate",
        noData: "No data available for the selected period.",
        noTargets: "No target currencies selected.",
        errorMsg: "Error loading data. Please try again.",
        language: "CZ",
        // Nové překlady pro Login
        loginTitle: "Admin Login",
        username: "Username",
        password: "Password",
        loginBtn: "Sign In",
        logoutBtn: "Log out",
        loginError: "Invalid username or password.",
		// Do anglické sekce (en -> translation):
tableDate: "Date",
tableBase: "Base Currency",
tableTarget: "Target Currency",
tableRate: "Exchange Rate"


      }
    },
    cz: {
      translation: {
        title: "Analýza měn",
        baseCurrency: "Základní měna:",
        compareCurrencies: "Porovnat s (Multi-select):",
        dateFrom: "Datum od:",
        dateTo: "Datum do:",
        calculateBtn: "Spočítat",
        results: "Výsledky",
        results2: "Data z časového období",
        average: "Celkový průměrný kurz",
        average2: "Průměrné kurzy pro každou měnu v časovém období",
        average3: "Průměrný kurz",
        strongest: "Nejsilnější kurz měny",
        weakest: "Nejslabší kurz měny",
        noData: "Pro vybrané období nejsou k dispozici žádná data.",
		noTargets:"Žádné měny k porovnání",
        errorMsg: "Chyba při načítání dat. Zkuste to prosím znovu.",
        language: "EN",
        // Nové překlady pro Login
        loginTitle: "Přihlášení",
        username: "Uživatelské jméno",
        password: "Heslo",
        loginBtn: "Přihlásit se",
        logoutBtn: "Odhlásit se",
        loginError: "Neplatné jméno nebo heslo.",
		// Do české sekce (cz -> translation):
tableDate: "Datum",
tableBase: "Základní měna",
tableTarget: "Cílová měna",
tableRate: "Kurz"
      }
    }
  },
  lng: "cz",
  fallbackLng: "en",
});

function App() {
  const { t } = useTranslation();

  // --- STAVY PRO PŘIHLÁŠENÍ ---
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('jwt_token'));
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- STAVY PRO APLIKACI ---
  const [currencies, setCurrencies] = useState([]);
  const [baseCurrency, setBaseCurrency] = useState('EUR');
  const [targetCurrencies, setTargetCurrencies] = useState([]);
  
  const getLocalDateString = (daysOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dateFrom, setDateFrom] = useState(getLocalDateString(0)); 
  const [dateTo, setDateTo] = useState(getLocalDateString(0));
  
  const [summary, setSummary] = useState(null);
  const [appError, setAppError] = useState('');
useEffect(() => {
  const loadPreferences = async () => {
    try {
      const token = localStorage.getItem('token'); // Předpokládám uložení JWT
      if (!token) return;

      const response = await fetch('https://stingraf-hzf9cxgtgcg7fzcg.germanywestcentral-01.azurewebsites.net/api/Preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBaseCurrency(data.baseCurrency);
        setTargetCurrencies(data.targetCurrencies);
        setDateFrom(data.dateFrom);
        setDateTo(data.dateTo);
      }
    } catch (error) {
      console.error("Nepodařilo se načíst nastavení:", error);
    }
  };

  loadPreferences();
}, []); 
  // --- EFEKTY PŘI NAČTENÍ ---
  useEffect(() => {
    if (isAuthenticated) {
	const asyncfunc = async ()=>{
	 try {
      const token = localStorage.getItem('jwt_token'); // Předpokládám uložení JWT
      if (!token) return;

      const response = await fetch('https://stingraf-hzf9cxgtgcg7fzcg.germanywestcentral-01.azurewebsites.net/api/Preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBaseCurrency(data.baseCurrency);
        setTargetCurrencies(data.targetCurrencies);
        setDateFrom(data.dateFrom);
        setDateTo(data.dateTo);
      }
    } catch (error) {
      console.error("Nepodařilo se načíst nastavení ze serveru:", error);
	        const savedBase = localStorage.getItem('savedBaseCurrency');
      const savedTargets = localStorage.getItem('savedTargetCurrencies');
      if (savedBase) setBaseCurrency(savedBase);
      if (savedTargets) setTargetCurrencies(JSON.parse(savedTargets));

    }


      fetchAvailableCurrencies();
    }
	asyncfunc();
	}
  }, [isAuthenticated]); // Tento efekt se spustí vždy, když se uživatel přihlásí

  const logErrorToPersistentStorage = (errorDetails) => {
    const existingLogs = JSON.parse(localStorage.getItem('frontend_error_logs') || '[]');
    existingLogs.push({ timestamp: new Date().toISOString(), details: errorDetails });
    if (existingLogs.length > 50) existingLogs.shift();
    localStorage.setItem('frontend_error_logs', JSON.stringify(existingLogs));
  };

  // --- FUNKCE PRO PŘIHLÁŠENÍ A ODHLÁŠENÍ ---
  const handleLogin = async (e) => {
    e.preventDefault(); // Zabrání znovunačtení stránky při odeslání formuláře
    setLoginError('');

    try {
		console.log(loginUser);
		console.log(loginPass);
      const response = await fetch('https://stingraf-hzf9cxgtgcg7fzcg.germanywestcentral-01.azurewebsites.net/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });

      if (!response.ok) throw new Error('Unauthorized');

      const data = await response.json();
      localStorage.setItem('jwt_token', data.token); // Uložení tokenu
      setIsAuthenticated(true); // Přepnutí obrazovky na hlavní aplikaci
      setLoginPass(''); // Smazání hesla z paměti pro jistotu
    } catch (err) {
      logErrorToPersistentStorage("Login failed: " + err.message);
      setLoginError(t('loginError'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setIsAuthenticated(false);
    setSummary(null);
  };

  // --- API VOLÁNÍ PRO DATA ---
  const fetchAvailableCurrencies = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('https://stingraf-hzf9cxgtgcg7fzcg.germanywestcentral-01.azurewebsites.net/api/currency/availableCurrencies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        handleLogout(); // Pokud token vypršel, automaticky odhlásíme
        throw new Error('Token expired');
      }
      
      if (!response.ok) throw new Error('Failed to fetch currencies');
      const data = await response.json();
      setCurrencies(data);
    } catch (err) {
      logErrorToPersistentStorage(err.message);
      setAppError(t('errorMsg'));
    }
  };
	
const handleCalculate = async () => {
    setAppError('');
    setSummary(null);
    
    // OPRAVA: Použití .length místo .Count
    if (targetCurrencies.length === 0) {
      setAppError(t('noTargets'));
      return;
    }

    localStorage.setItem('savedBaseCurrency', baseCurrency);
    localStorage.setItem('savedTargetCurrencies', JSON.stringify(targetCurrencies));
    
    try {
      const token = localStorage.getItem('jwt_token');
      const targetsParam = targetCurrencies.join(',');
      const url = `https://stingraf-hzf9cxgtgcg7fzcg.germanywestcentral-01.azurewebsites.net/api/currency/summaryRange?baseCurr=${baseCurrency}&targets=${targetsParam}&from=${dateFrom}&to=${dateTo}`;
      console.log(url)
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error('Token expired');
      }

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();

      if (!data || !data.allRates || data.allRates.length === 0) {
        setAppError(t('noData'));
        return;
      }

      setSummary(data);
    } catch (err) {
      logErrorToPersistentStorage(err.message);
      setAppError(t('errorMsg'));
    }
    
    try {
      const token = localStorage.getItem('jwt_token');
      await fetch('https://stingraf-hzf9cxgtgcg7fzcg.germanywestcentral-01.azurewebsites.net/api/Preferences', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          baseCurrency,
          targetCurrencies,
          dateFrom,
          dateTo
        })
      });
    } catch (error) {
      console.error("Nepodařilo se uložit nastavení:", error);
    }
  };

  const handleCheckboxChange = (isoCode) => {
  setTargetCurrencies(prev => {
    // Pokud už měna v poli je, odstraníme ji
    if (prev.includes(isoCode)) {
      return prev.filter(code => code !== isoCode);
    } 
    // Pokud tam není, přidáme ji
    else {
      return [...prev, isoCode];
    }
  });
};

  // --- VYKRESLENÍ (RENDER) ---

  // 1. Obrazovka přihlášení (pokud není autentizován)
  if (!isAuthenticated) {
    return (
      <div className="login-wrapper">
        <form className="login-box" onSubmit={handleLogin}>
          <h2>{t('loginTitle')}</h2>
          
          <div className="form-group">
            <label>{t('username')}</label>
            <input 
              type="text" 
              value={loginUser} 
              onChange={(e) => setLoginUser(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>{t('password')}</label>
            <input 
              type="password" 
              value={loginPass} 
              onChange={(e) => setLoginPass(e.target.value)} 
              required 
            />
          </div>

          {loginError && <div className="error-message">{loginError}</div>}
          
          <button type="submit" className="calc-btn">{t('loginBtn')}</button>

          <button type="button" className="lang-switch-link" onClick={() => i18n.changeLanguage(i18n.language === 'cz' ? 'en' : 'cz')}>
            {t('language')}
          </button>
        </form>
      </div>
    );
  }

  // 2. Hlavní obrazovka aplikace (pokud JE autentizován)
  return (
    <div className="container">
      <header>
        <h1>{t('title')}</h1>
        <div className="header-actions">
          <button onClick={() => i18n.changeLanguage(i18n.language === 'cz' ? 'en' : 'cz')}>
            {t('language')}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            {t('logoutBtn')}
          </button>
        </div>
      </header>

      <div className="form-group">
        <label>{t('baseCurrency')}</label>
        <select value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)}>
          {currencies.map(c => (
            <option key={c.iso_code} value={c.iso_code}>{c.iso_code} - {c.name}</option>
          ))}
        </select>
      </div>

     <div className="form-group">
  <label>{t('compareCurrencies')}</label>
  <div className="checkbox-group">
    {currencies.map(c => (
      <label key={c.iso_code} className="checkbox-label">
        <input
          type="checkbox"
          value={c.iso_code}
          checked={targetCurrencies.includes(c.iso_code)}
          onChange={() => handleCheckboxChange(c.iso_code)}
        />
        {c.iso_code} - {c.name}
      </label>
    ))}
  </div>
</div>

      <div className="date-group">
        <div className="form-group">
          <label>{t('dateFrom')}</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group">
          <label>{t('dateTo')}</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <button className="calc-btn" onClick={handleCalculate}>{t('calculateBtn')}</button>

      {appError && <div className="error-message">{appError}</div>}

      {summary && (
        <div className="results">
		<br/>
          <h2>{t('results')}</h2>
          <div className="stats-grid">
		  
  {/* PRŮMĚR */
  /*
  <div className="stat-card">
    <h3>{t('average')}</h3>
    <p className="stat-value">
      {summary.averageRate ? summary.averageRate.toFixed(4) : '-'}
    </p>
    <span className="stat-detail">Base: <strong>{baseCurrency}</strong></span>
  </div>
  */}
  {/* NEJSILNĚJŠÍ MĚNA */}
  <div className="stat-card">
    <h3>{t('strongest')}</h3>
    <p className="stat-value">{summary.strongest?.rate}</p>
    <span className="stat-detail">
      <strong>{baseCurrency}</strong> → <strong>{summary.strongest?.quote || summary.strongest?.quoteCurrency}</strong><br />
      </span>
  </div>

  {/* NEJSLABŠÍ MĚNA */}
  <div className="stat-card">
    <h3>{t('weakest')}</h3>
    <p className="stat-value">{summary.weakest?.rate}</p>
    <span className="stat-detail">
      <strong>{baseCurrency}</strong> → <strong>{summary.weakest?.quote || summary.weakest?.quoteCurrency}</strong><br />
    </span>
  </div>
</div>

{summary.averageRates && summary.averageRates.length > 0 && (
            <div className="averages-section">
              <h3>{t('average2')}</h3>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>{t('tableBase')}</th>
                    <th>{t('tableTarget')}</th>
                    <th>{t('average3')}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.averageRates.map((avg, index) => {
                    const targetCurr = avg.quoteCurrency || avg.quote || avg.currency || 'N/A';
                    return (
                      <tr key={`avg-${targetCurr}-${index}`}>
                        <td><span className="currency-badge base">{baseCurrency}</span></td>
                        <td><span className="currency-badge target">{targetCurr}</span></td>
                        <td className="rate-cell">
                          <strong>{avg.rate ? avg.rate.toFixed(5) : '-'}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
		  
		  
              <h3>{t('results2')}</h3>
        <table className="results-table">
  <thead>
    <tr>
      <th>{t('tableDate')}</th>
      <th>{t('tableBase')}</th>
      <th>{t('tableTarget')}</th>
      <th>{t('tableRate')}</th>
    </tr>
  </thead>
  <tbody>
    {summary.allRates.map((rate, index) => {
      // 1. Bezpečné získání cílové měny (záleží, jak se vlastnost jmenuje v tvém C# DTO)
      const targetCurr = rate.quoteCurrency || rate.quote || rate.currency || rate.targetCurrency || 'N/A';
      
      // 2. Hezké formátování data (z '2026-05-01T00:00:00' udělá '1. 5. 2026')
      const formattedDate = new Date(rate.date).toLocaleDateString(i18n.language === 'cz' ? 'cs-CZ' : 'en-US');

      return (
        <tr key={`${rate.date}-${targetCurr}-${index}`}>
          <td>{formattedDate}</td>
          <td><span className="currency-badge base">{baseCurrency}</span></td>
          <td><span className="currency-badge target">{targetCurr}</span></td>
          <td className="rate-cell">
            <strong>{rate.rate ? rate.rate.toFixed(5) : '-'}</strong>
          </td>
        </tr>
      );
    })}
  </tbody>
</table>
        </div>
      )}
    </div>
  );
}

export default App;

