import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Utensils, Box, Edit2, Check, TrendingUp, AlertCircle, Plus, Trash2, Package, X, Save, Search, Download, Upload, Settings, DollarSign, Calculator, ShoppingCart, FileSpreadsheet, ChevronRight, Gift, Layers, ChevronDown, Percent, ArrowUpDown, Smartphone, Share, MoreVertical, LayoutGrid, Cloud, Wifi, WifiOff, AlertTriangle, Truck } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// ==========================================
// 🔴 已填入您的 Firebase 設定 (正式連線版)
// ==========================================
const MY_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCBsFyPDJK1fwbOho3Nda0F8zy0ZiFAw-8",
  authDomain: "dessert-e443b.firebaseapp.com",
  projectId: "dessert-e443b",
  storageBucket: "dessert-e443b.firebasestorage.app",
  messagingSenderId: "1015521039202",
  appId: "1:1015521039202:web:ec7051f64cf3b9d490123b",
  measurementId: "G-1WVFZE8XC3"
};

// --- Firebase 初始化邏輯 ---
const isCustomConfig = MY_FIREBASE_CONFIG.apiKey && MY_FIREBASE_CONFIG.apiKey.length > 0;

const firebaseConfig = isCustomConfig 
  ? MY_FIREBASE_CONFIG 
  : (typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null);

const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

// 在正式版使用固定 ID，在預覽版使用環境 ID
const appId = isCustomConfig ? 'my-dessert-shop' : (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id');

// --- 關鍵修正：取得集合路徑 ---
const getCollectionRef = (collectionName) => {
  if (!db) return null;
  if (isCustomConfig) {
    return collection(db, collectionName);
  } else {
    return collection(db, 'artifacts', appId, 'public', 'data', collectionName);
  }
};

const getDocRef = (collectionName, docId) => {
  if (!db) return null;
  if (isCustomConfig) {
    return doc(db, collectionName, docId);
  } else {
    return doc(db, 'artifacts', appId, 'public', 'data', collectionName, docId);
  }
};

// --- 色票系統 ---
const COLORS = {
  bg: '#0a0a0a',
  card: 'rgba(30, 30, 30, 0.6)',
  cardBorder: 'rgba(212, 175, 55, 0.3)',
  gold: '#D4AF37',
  goldGradient: 'linear-gradient(135deg, #D4AF37 0%, #F5D061 50%, #B4922B 100%)',
  text: '#E0E0E0',
  subText: '#9ca3af',
  danger: '#F87171',
  success: '#34D399',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  barMaterial: '#60A5FA',
  barOther: '#F472B6',
  barProfit: '#34D399'
};

const UNIT_OPTIONS = [
  { label: '重量', options: ['g', 'kg', '台斤', 'lb'] },
  { label: '體積', options: ['ml', 'L', 'cc'] },
  { label: '數量', options: ['個', '顆', '支', '片', '張', '組', '包', '罐', '瓶', '盒'] },
  { label: '長度', options: ['m', 'cm'] }
];

const PRODUCT_CATEGORIES = [
  { id: 'all', label: '全部', icon: '📋' },
  { id: 'cake', label: '蛋糕', icon: '🍰' },
  { id: 'cookie', label: '餅乾', icon: '🍪' },
  { id: 'dessert', label: '甜點', icon: '🍮' },
  { id: 'other', label: '其他', icon: '🏷️' }
];

const INITIAL_INGREDIENTS = [
  { id: 1, name: '法國無鹽奶油', purchase_price: 280, purchase_amount: 500, unit: 'g', category: 'ingredient', supplier: 'Costco' },
  { id: 2, name: '日本特級麵粉', purchase_price: 150, purchase_amount: 1000, unit: 'g', category: 'ingredient', supplier: '進口商A' },
  { id: 3, name: '上白糖', purchase_price: 85, purchase_amount: 1000, unit: 'g', category: 'ingredient', supplier: '全聯' },
  { id: 4, name: '牧場雞蛋', purchase_price: 12, purchase_amount: 1, unit: '顆', category: 'ingredient', supplier: '小農直送' },
  { id: 5, name: '70% 巧克力', purchase_price: 450, purchase_amount: 1000, unit: 'g', category: 'ingredient', supplier: '烘焙材料行' },
  { id: 6, name: '馬達加斯加香草莢', purchase_price: 120, purchase_amount: 1, unit: '支', category: 'ingredient', supplier: '網購' },
  { id: 7, name: '6吋蛋糕盒(含底托)', purchase_price: 450, purchase_amount: 10, unit: '組', category: 'packaging', supplier: '包材行' },
  { id: 8, name: '品牌貼紙', purchase_price: 200, purchase_amount: 500, unit: '張', category: 'packaging', supplier: '印刷廠' },
  { id: 9, name: '緞帶 (2cm寬)', purchase_price: 150, purchase_amount: 50, unit: 'm', category: 'packaging', supplier: '大創' },
];

const INITIAL_FORMULAS = [
  {
    id: 101,
    name: '經典巧克力蛋糕 (6吋)',
    category: 'cake',
    target_price: 650,
    yield_amount: 1, 
    other_cost: 50,
    ingredients: [
      { id: 1, amount: 150 },
      { id: 2, amount: 120 },
      { id: 3, amount: 100 },
      { id: 4, amount: 3 },
      { id: 5, amount: 200 },
      { id: 7, amount: 1 },
      { id: 9, amount: 0.8 },
    ]
  },
  {
    id: 102,
    name: '手工香草餅乾 (包)',
    category: 'cookie',
    target_price: 120,
    yield_amount: 15,
    other_cost: 100,
    ingredients: [
      { id: 1, amount: 200 },
      { id: 2, amount: 300 },
      { id: 3, amount: 150 },
      { id: 4, amount: 1 },
      { id: 6, amount: 1 },
      { id: 8, amount: 15 },
    ]
  }
];

const GradientText = ({ children, className }) => (
  <span className={className} style={{ backgroundImage: COLORS.goldGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
    {children}
  </span>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('recipes');
  const [inventoryCategory, setInventoryCategory] = useState('ingredient'); 
  const [productCategory, setProductCategory] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  const [ingredients, setIngredients] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  
  // --- 雲端連線與資料同步 ---
  useEffect(() => {
    if (!app) {
      setConnectionError("尚未設定 Firebase Config");
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (isCustomConfig) {
          await signInAnonymously(auth);
        } else {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        }
      } catch (err) {
        console.error("Auth Error:", err);
        setConnectionError("連線驗證失敗");
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // 資料監聽
  useEffect(() => {
    if (!user || !db) return;

    const unsubIng = onSnapshot(
      getCollectionRef('ingredients'), 
      (snapshot) => {
        const data = [];
        snapshot.forEach(doc => data.push(doc.data()));
        setIngredients(data);
        setLoading(false);
        setConnectionError(null);
      },
      (error) => {
        console.error("Error fetching ingredients:", error);
        if (error.code === 'permission-denied') {
          setConnectionError("permission-denied");
        } else {
          setConnectionError("讀取資料失敗");
        }
        setLoading(false);
      }
    );

    const unsubForm = onSnapshot(
      getCollectionRef('formulas'),
      (snapshot) => {
        const data = [];
        snapshot.forEach(doc => data.push(doc.data()));
        setFormulas(data);
      },
      (error) => console.error("Error fetching formulas:", error)
    );

    return () => {
      unsubIng();
      unsubForm();
    };
  }, [user]);
  
  // --- Modal 狀態 ---
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [installModalVisible, setInstallModalVisible] = useState(false); 
  const [modalMode, setModalMode] = useState('add');
  
  // --- 表單狀態 ---
  const [formId, setFormId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formSupplier, setFormSupplier] = useState(''); // 新增：供應商狀態
  const [formPrice, setFormPrice] = useState('');
  const [formProfitMargin, setFormProfitMargin] = useState(''); 
  const [formAmount, setFormAmount] = useState('');
  const [formYield, setFormYield] = useState('');
  const [formOtherCost, setFormOtherCost] = useState('');
  const [formUnit, setFormUnit] = useState('g');
  const [formCategory, setFormCategory] = useState('ingredient'); 
  const [formProductCategory, setFormProductCategory] = useState('cake'); 
  
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const fileInputRef = useRef(null);

  const [calcRecipeId, setCalcRecipeId] = useState('');
  const [calcQuantity, setCalcQuantity] = useState('');

  const getDeviceType = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return 'ios';
    if (/android/i.test(userAgent)) return 'android';
    return 'desktop';
  };
  const [deviceType, setDeviceType] = useState('desktop');
  useEffect(() => { setDeviceType(getDeviceType()); }, []);

  const sortedAllIngredients = useMemo(() => {
    return [...ingredients].sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
  }, [ingredients]);

  const sortedAllFormulas = useMemo(() => {
    return [...formulas].sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
  }, [formulas]);

  const filteredRecipes = useMemo(() => {
    let list = formulas;
    if (productCategory !== 'all') {
      list = list.filter(item => (item.category || 'other') === productCategory);
    }
    const computedList = list.map(recipe => {
      let materialCost = 0;
      (recipe.ingredients || []).forEach(item => {
        const ingredient = ingredients.find(ing => ing.id === Number(item.id));
        if (ingredient) {
          const unitPrice = ingredient.purchase_price / ingredient.purchase_amount;
          materialCost += unitPrice * item.amount;
        }
      });
      const otherCost = Number(recipe.other_cost) || 0;
      const totalBatchCost = materialCost + otherCost;
      const yieldAmount = recipe.yield_amount || 1;
      const unitCost = totalBatchCost / yieldAmount;
      const profit = recipe.target_price - unitCost;
      const profitMargin = recipe.target_price > 0 ? ((profit / recipe.target_price) * 100) : 0;
      const pctMaterial = (materialCost / yieldAmount / recipe.target_price) * 100;
      const pctOther = (otherCost / yieldAmount / recipe.target_price) * 100;
      const pctProfit = profitMargin;
      return { ...recipe, materialCost, otherCost, totalBatchCost, unitCost, profit, profitMargin, yieldAmount, pctMaterial, pctOther, pctProfit };
    });
    const searchFiltered = searchQuery ? computedList.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) : computedList;
    return searchFiltered.sort((a, b) => (a.profitMargin - b.profitMargin) || a.name.localeCompare(b.name, "zh-Hant"));
  }, [formulas, ingredients, searchQuery, productCategory]);

  const filteredIngredients = useMemo(() => {
    let list = ingredients;
    if (activeTab === 'ingredients') {
      list = list.filter(item => {
        const cat = item.category || 'ingredient';
        return cat === inventoryCategory;
      });
    }
    if (searchQuery) list = list.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return list.sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
  }, [ingredients, searchQuery, activeTab, inventoryCategory]);

  const productionList = useMemo(() => {
    if (!calcRecipeId || !calcQuantity) return null;
    const recipe = formulas.find(r => r.id === Number(calcRecipeId));
    if (!recipe) return null;
    const ratio = Number(calcQuantity) / (recipe.yield_amount || 1);
    return (recipe.ingredients || []).map(item => {
      const ing = ingredients.find(i => i.id === Number(item.id));
      if (!ing) return null;
      return { 
        name: ing.name, 
        unit: ing.unit, 
        supplier: ing.supplier || '', // 顯示供應商
        category: ing.category || 'ingredient', 
        totalNeeded: item.amount * ratio, 
        cost: (ing.purchase_price / ing.purchase_amount) * (item.amount * ratio) 
      };
    }).filter(Boolean);
  }, [calcRecipeId, calcQuantity, formulas, ingredients]);

  const currentEditingMaterialCost = useMemo(() => {
    return recipeIngredients.reduce((total, item) => {
       const ing = ingredients.find(i => i.id === Number(item.id));
       if (!ing) return total;
       return total + (ing.purchase_price / ing.purchase_amount) * item.amount;
    }, 0);
  }, [recipeIngredients, ingredients]);

  const currentUnitCost = useMemo(() => {
    const totalBatch = currentEditingMaterialCost + (Number(formOtherCost) || 0);
    const yieldAmount = Number(formYield) || 1;
    return totalBatch / yieldAmount;
  }, [currentEditingMaterialCost, formOtherCost, formYield]);

  const handlePriceChange = (val) => {
    setFormPrice(val);
    if (val && currentUnitCost > 0) {
      const margin = ((val - currentUnitCost) / val * 100);
      setFormProfitMargin(margin.toFixed(1));
    } else setFormProfitMargin('');
  };

  const handleMarginChange = (val) => {
    setFormProfitMargin(val);
    if (val && currentUnitCost > 0 && val < 100) {
      const price = currentUnitCost / (1 - (val / 100));
      setFormPrice(Math.ceil(price).toString());
    }
  };

  // --- 雲端操作 ---
  const handleSave = async () => {
    if (!formName || !formPrice) return alert('請填寫完整資訊');
    if (!user) return alert('請檢查網路連線或 Firebase 設定');

    const id = modalMode === 'add' ? Date.now() : formId;
    let data = {};
    let collectionName = '';

    if (activeTab === 'ingredients') {
      collectionName = 'ingredients';
      data = { 
        id, 
        name: formName, 
        supplier: formSupplier, // 儲存供應商
        purchase_price: parseFloat(formPrice), 
        purchase_amount: parseFloat(formAmount) || 1, 
        unit: formUnit || '個', 
        category: formCategory 
      };
    } else {
      collectionName = 'formulas';
      data = { id, name: formName, target_price: parseFloat(formPrice), yield_amount: parseFloat(formYield) || 1, other_cost: parseFloat(formOtherCost) || 0, category: formProductCategory, ingredients: recipeIngredients };
    }

    try {
      await setDoc(getDocRef(collectionName, id.toString()), data);
      setModalVisible(false);
    } catch (e) { alert('儲存失敗：' + e.message); }
  };

  const handleDelete = async () => {
    if (confirm('確定要刪除嗎？')) {
      const collectionName = activeTab === 'ingredients' ? 'ingredients' : 'formulas';
      try {
        await deleteDoc(getDocRef(collectionName, formId.toString()));
        setModalVisible(false);
      } catch (e) { alert('刪除失敗：' + e.message); }
    }
  };

  const initializeSampleData = async () => {
    if(!confirm('這將會寫入範例資料，如果已有資料可能會重複，確定嗎？')) return;
    try {
      const batchPromises = [];
      INITIAL_INGREDIENTS.forEach(item => batchPromises.push(setDoc(getDocRef('ingredients', item.id.toString()), item)));
      INITIAL_FORMULAS.forEach(item => batchPromises.push(setDoc(getDocRef('formulas', item.id.toString()), item)));
      await Promise.all(batchPromises);
      alert('範例資料已匯入！');
      setSettingsModalVisible(false);
    } catch(e) { alert('初始化失敗：' + e.message); }
  };

  const exportToCSV = () => {
    const bom = '\uFEFF';
    const headers = ['類別', '食譜名稱', '預計產出(份)', '單個售價', '單個總成本', '單個利潤', '利潤率(%)', '食材成本(佔比)', '其他雜支(佔比)'];
    const allComputed = sortedAllFormulas.map(recipe => {
        let materialCost = 0;
        (recipe.ingredients||[]).forEach(item => {
            const ingredient = ingredients.find(ing => ing.id === Number(item.id));
            if (ingredient) materialCost += (ingredient.purchase_price / ingredient.purchase_amount) * item.amount;
        });
        const otherCost = Number(recipe.other_cost) || 0;
        const totalBatchCost = materialCost + otherCost;
        const yieldAmount = recipe.yield_amount || 1;
        const unitCost = totalBatchCost / yieldAmount;
        const profit = recipe.target_price - unitCost;
        const profitMargin = recipe.target_price > 0 ? ((profit / recipe.target_price) * 100) : 0;
        const pctMaterial = (materialCost / yieldAmount / recipe.target_price) * 100;
        const pctOther = (otherCost / yieldAmount / recipe.target_price) * 100;
        const catLabel = PRODUCT_CATEGORIES.find(c => c.id === (recipe.category || 'other'))?.label || '其他';
        return { ...recipe, unitCost, profit, profitMargin, materialCost, otherCost, yieldAmount, pctMaterial, pctOther, catLabel };
    });
    const rows = allComputed.map(r => [r.catLabel, `"${r.name}"`, r.yieldAmount, r.target_price, r.unitCost.toFixed(1), r.profit.toFixed(1), r.profitMargin.toFixed(1), `${(r.materialCost/r.yieldAmount).toFixed(1)} (${r.pctMaterial.toFixed(0)}%)`, `${(r.otherCost/r.yieldAmount).toFixed(1)} (${r.pctOther.toFixed(0)}%)`]);
    const csvContent = bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cost_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setSettingsModalVisible(false);
  };

  // --- Modal Helpers ---
  const openAddModal = () => {
    setModalMode('add'); setFormId(Date.now()); setFormName(''); setFormSupplier(''); setFormPrice(''); setFormProfitMargin(''); setFormAmount(''); setFormYield('1'); setFormOtherCost('0'); setFormUnit('g'); setFormCategory(inventoryCategory); setFormProductCategory(productCategory === 'all' ? 'cake' : productCategory); setRecipeIngredients([]); setModalVisible(true);
  };
  const openEditIngredient = (item) => {
    setModalMode('edit'); setFormId(item.id); setFormName(item.name); setFormSupplier(item.supplier || ''); setFormPrice(item.purchase_price); setFormAmount(item.purchase_amount); setFormUnit(item.unit); setFormCategory(item.category || 'ingredient'); setModalVisible(true);
  };
  const openEditRecipe = (item) => {
    setModalMode('edit'); setFormId(item.id); setFormName(item.name); setFormPrice(item.target_price); setFormYield(item.yield_amount || 1); setFormOtherCost(item.other_cost || 0); setFormProductCategory(item.category || 'other'); setRecipeIngredients(item.ingredients || []);
    let matCost = 0; (item.ingredients || []).forEach(i => { const ing = ingredients.find(ig => ig.id === i.id); if(ing) matCost += (ing.purchase_price / ing.purchase_amount) * i.amount; });
    const totalCost = (matCost + (Number(item.other_cost) || 0)) / (item.yield_amount || 1);
    const margin = item.target_price > 0 ? ((item.target_price - totalCost) / item.target_price * 100).toFixed(1) : 0;
    setFormProfitMargin(margin); setModalVisible(true);
  };
  const addIngredientToRecipe = () => {
    if (!selectedIngredientId || !addAmount) return;
    const existingIndex = recipeIngredients.findIndex(item => item.id === Number(selectedIngredientId));
    if (existingIndex >= 0) { const updatedList = [...recipeIngredients]; updatedList[existingIndex].amount = parseFloat(addAmount); setRecipeIngredients(updatedList); } else { setRecipeIngredients([...recipeIngredients, { id: Number(selectedIngredientId), amount: parseFloat(addAmount) }]); }
    setAddAmount('');
  };
  const removeIngredientFromRecipe = (ingId) => { setRecipeIngredients(recipeIngredients.filter(item => item.id !== ingId)); };

  return (
    <div className="flex flex-col h-screen w-full font-sans overflow-hidden bg-[#0a0a0a] text-gray-200">
      
      {/* Header */}
      <header className="px-5 border-b border-white/10 shadow-lg z-20 flex flex-col gap-4 relative backdrop-blur-xl bg-black/40" style={{ paddingTop: 'max(1.2rem, env(safe-area-inset-top))', paddingBottom: '1.2rem' }}>
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-widest flex items-center gap-2 text-white">
            {activeTab === 'recipes' && <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/5"><TrendingUp size={20} className="text-yellow-500" /></div>}
            {activeTab === 'calculator' && <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/5"><Calculator size={20} className="text-blue-400" /></div>}
            {activeTab === 'ingredients' && <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/5"><Package size={20} className="text-purple-400" /></div>}
            <GradientText>
              {activeTab === 'recipes' && '甜點儀表板'}
              {activeTab === 'calculator' && '製作計算機'}
              {activeTab === 'ingredients' && '原料庫存'}
            </GradientText>
          </h1>
          <div className="flex items-center gap-2">
            {user ? (
                <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full text-[10px] text-green-400">
                  <Wifi size={10} /> {isCustomConfig ? '自有雲端' : '預覽連線'}
                </div>
            ) : (
                <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full text-[10px] text-red-400">
                  <WifiOff size={10} /> 離線
                </div>
            )}
            <button onClick={() => setSettingsModalVisible(true)} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95 shadow-lg shadow-black/20">
              <Settings size={20} className="text-gray-300" />
            </button>
          </div>
        </div>
        
        {activeTab !== 'calculator' && (
          <div className="relative group">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
            <input type="text" placeholder={activeTab === 'recipes' ? "搜尋食譜..." : "搜尋原料或包材..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-base focus:outline-none focus:border-yellow-500/50 focus:bg-white/10 transition-all shadow-inner placeholder-gray-600"/>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-32 space-y-4 z-10 scroll-smooth">
        
        {loading && (
          <div className="text-center text-gray-500 mt-20 flex flex-col items-center gap-2">
            <Cloud className="animate-bounce text-yellow-500" size={32} />
            <p>正在同步雲端資料...</p>
          </div>
        )}

        {!loading && connectionError === 'permission-denied' && (
           <div className="text-center text-gray-300 mt-10 p-6 border border-red-500/30 rounded-2xl bg-red-900/10 mx-4">
             <AlertTriangle className="mx-auto mb-3 text-red-400" size={48} />
             <h3 className="text-xl font-bold text-white mb-2">權限不足 (Permission Denied)</h3>
             <p className="mb-4 text-sm">您的 Firebase 資料庫規則設定為「拒絕讀寫」。</p>
             <div className="text-left bg-black/40 p-4 rounded-xl text-xs font-mono text-gray-400 mb-4 border border-white/10">
               1. 前往 Firebase Console &gt; Firestore Database<br/>
               2. 點選「規則 (Rules)」分頁<br/>
               3. 將內容改為：<br/>
               <span className="text-green-400 block mt-1">allow read, write: if true;</span>
             </div>
             <p className="text-xs text-gray-500">修改後請點擊「發布」，並重新整理此頁面。</p>
           </div>
        )}

        {!loading && !user && !connectionError && (
           <div className="text-center text-gray-500 mt-20 p-4 border border-white/10 rounded-xl bg-white/5">
             <WifiOff className="mx-auto mb-2 text-red-400" size={32} />
             <p className="mb-2 font-bold text-white">尚未連線</p>
             <p className="text-sm">若您已設定 MY_FIREBASE_CONFIG，請檢查設定是否正確。</p>
           </div>
        )}

        {!loading && user && !connectionError && activeTab === 'recipes' && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 custom-scrollbar-hide">
              {PRODUCT_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setProductCategory(cat.id)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border ${productCategory === cat.id ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}>
                  <span>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRecipes.map((item) => (
                <div key={item.id} onClick={() => openEditRecipe(item)} className="group relative overflow-hidden rounded-2xl p-5 border border-white/5 bg-white/5 backdrop-blur-md transition-all active:scale-[0.98] cursor-pointer hover:border-yellow-500/30 hover:shadow-2xl hover:shadow-yellow-900/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                         <div className="p-2 bg-white/5 rounded-lg text-xl border border-white/5">{PRODUCT_CATEGORIES.find(c => c.id === (item.category || 'other'))?.icon}</div>
                         <div><span className="text-[10px] text-gray-500 uppercase tracking-wide font-bold block mb-0.5">{PRODUCT_CATEGORIES.find(c => c.id === (item.category || 'other'))?.label}</span><h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-yellow-100 transition-colors">{item.name}</h3></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                       <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 flex flex-col items-center justify-center">
                          <span className="text-xs text-gray-500 font-medium mb-0.5">售價</span><span className="text-xl font-bold text-yellow-400 font-mono tracking-tight">${item.target_price}</span>
                       </div>
                       <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden ${item.profitMargin < 30 ? 'bg-rose-950/30 border-rose-500/30' : 'bg-emerald-950/30 border-emerald-500/30'}`}>
                          <span className={`text-xs font-medium mb-0.5 ${item.profitMargin < 30 ? 'text-rose-300' : 'text-emerald-300'}`}>毛利率</span>
                          <span className={`text-xl font-bold font-mono tracking-tight ${item.profitMargin < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>{item.profitMargin.toFixed(0)}%</span>
                       </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/40 flex overflow-hidden mb-2 shadow-inner">
                      <div className="h-full rounded-l-full transition-all duration-500 ease-out" style={{ width: `${Math.min(item.pctMaterial, 100)}%`, backgroundColor: COLORS.barMaterial }} />
                      <div className="h-full transition-all duration-500 ease-out border-l border-black/10" style={{ width: `${Math.min(item.pctOther, 100)}%`, backgroundColor: COLORS.barOther }} />
                      {item.profitMargin > 0 && <div className="h-full rounded-r-full transition-all duration-500 ease-out border-l border-black/10" style={{ width: `${Math.min(item.pctProfit, 100)}%`, backgroundColor: COLORS.barProfit }} />}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div><span className="text-gray-500 text-xs block">總成本</span><span className="font-medium text-white font-mono">${item.unitCost.toFixed(1)}</span></div>
                      <div className="text-right"><span className="text-gray-500 text-xs block">淨利潤</span><span className={`font-bold font-mono ${item.profitMargin < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>${item.profit.toFixed(1)}</span></div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredRecipes.length === 0 && <div className="text-center mt-20 col-span-full opacity-50 flex flex-col items-center gap-4"><Box size={48} strokeWidth={1} /><p>這裡空空的，去設定匯入範例資料吧！</p></div>}
            </div>
          </>
        )}

        {!loading && user && !connectionError && activeTab === 'calculator' && (
          <div className="space-y-6 max-w-lg mx-auto">
            <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3" />
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10"><div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><ShoppingCart size={20}/></div>製作備料計算</h3>
              <div className="space-y-5 relative z-10">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">選擇產品</label>
                  <div className="relative">
                    <select value={calcRecipeId} onChange={(e) => setCalcRecipeId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-4 text-base focus:border-blue-500/50 outline-none text-white appearance-none transition-colors">
                      <option value="">請選擇...</option>
                      {PRODUCT_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                         const recipesInCat = sortedAllFormulas.filter(f => (f.category || 'other') === cat.id);
                         if (recipesInCat.length === 0) return null;
                         return ( <optgroup key={cat.id} label={cat.label}>{recipesInCat.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}</optgroup> );
                      })}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">預計製作數量</label>
                   <div className="relative">
                     <input type="number" value={calcQuantity} onChange={(e) => setCalcQuantity(e.target.value)} placeholder="0" className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-4 text-xl font-bold text-blue-400 placeholder-gray-700 focus:border-blue-500/50 outline-none transition-colors" />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">份</span>
                   </div>
                </div>
              </div>
            </div>
            {productionList && (
              <div className="p-5 rounded-3xl border border-white/5 bg-[#161616] shadow-inner">
                <h4 className="text-xs font-bold text-gray-500 mb-4 pb-2 border-b border-white/5 uppercase tracking-wider">採購清單</h4>
                <div className="space-y-1">
                  {productionList.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3 px-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 text-gray-200 font-medium">
                        {item.category === 'packaging' ? <Gift size={14} className="text-pink-400"/> : <Utensils size={14} className="text-blue-400"/>}
                        {item.name}
                        {item.supplier && <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-0.5"><Truck size={8} />{item.supplier}</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold text-lg font-mono">{Number.isInteger(item.totalNeeded) ? item.totalNeeded : item.totalNeeded.toFixed(1)} <span className="text-xs font-sans font-normal text-gray-500 ml-0.5">{item.unit}</span></div>
                        <div className="text-[10px] text-gray-600">預估成本 ${item.cost.toFixed(0)}</div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-6 pt-4 border-t border-dashed border-white/10 flex justify-between items-center"><span className="text-sm text-gray-400">總成本預估</span><span className="text-2xl font-bold text-white tracking-wide">${productionList.reduce((acc, curr) => acc + curr.cost, 0).toFixed(0)}</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && user && !connectionError && activeTab === 'ingredients' && (
          <>
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 mb-4">
              <button onClick={() => setInventoryCategory('ingredient')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${inventoryCategory === 'ingredient' ? 'bg-[#D4AF37] text-black shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:text-gray-300'}`}><Utensils size={16} />食材 (Ingredients)</button>
              <button onClick={() => setInventoryCategory('packaging')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${inventoryCategory === 'packaging' ? 'bg-[#D4AF37] text-black shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:text-gray-300'}`}><Gift size={16} />包材 (Packaging)</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIngredients.map((item) => (
                <div key={item.id} onClick={() => openEditIngredient(item)} className="group rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all border border-white/5 bg-white/5 hover:bg-white/10 hover:border-purple-500/30 active:scale-[0.98]">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2 group-hover:text-purple-200 transition-colors">
                      {item.category === 'packaging' ? <Gift size={14} className="text-pink-400"/> : null}{item.name}
                    </h3>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-medium px-2 py-0.5 rounded-md bg-black/30 text-gray-400 inline-block w-fit">
                        {item.purchase_amount} {item.unit} / ${item.purchase_price}
                      </p>
                      {item.supplier && (
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 pl-1">
                          <Truck size={10} /> {item.supplier}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end"><div className="text-lg font-bold text-purple-300 font-mono">${(item.purchase_price / item.purchase_amount).toFixed(2)} <span className="text-xs font-sans font-normal text-gray-500">/{item.unit}</span></div></div>
                </div>
              ))}
              {filteredIngredients.length === 0 && <div className="text-center mt-10 col-span-full opacity-50"><p>這裡目前沒有資料</p></div>}
            </div>
          </>
        )}
      </main>

      {/* FAB */}
      {activeTab !== 'calculator' && !connectionError && (
        <button onClick={openAddModal} className="fixed bottom-28 right-6 w-14 h-14 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center justify-center z-30 transition-transform active:scale-90 group bg-gradient-to-br from-[#D4AF37] to-[#B4922B]">
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
          <Plus size={28} strokeWidth={3} className="text-black drop-shadow-sm" />
        </button>
      )}

      {/* Bottom Nav */}
      <nav className="border-t border-white/10 flex fixed bottom-0 left-0 right-0 z-20 backdrop-blur-xl bg-black/60" style={{ height: 'auto', minHeight: '80px', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {[{ id: 'recipes', icon: Utensils, label: '產品利潤' }, { id: 'calculator', icon: Calculator, label: '製作計算' }, { id: 'ingredients', icon: Package, label: '庫存管理' }].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2 relative group" onClick={() => setActiveTab(tab.id)}>
              {isActive && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-12 bg-white/5 rounded-2xl blur-md" />}
              <div className={`relative transition-all duration-300 ${isActive ? '-translate-y-1' : 'group-hover:-translate-y-0.5'}`}><tab.icon size={24} color={isActive ? COLORS.gold : '#6b7280'} strokeWidth={isActive ? 2.5 : 2} className={`drop-shadow-sm ${isActive ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : ''}`} /></div>
              <span className={`text-[10px] tracking-wide transition-colors ${isActive ? 'font-bold text-[#D4AF37]' : 'font-medium text-gray-500'}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings Modal */}
      {settingsModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl p-6 border border-white/10 bg-[#121212] shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-[50px] pointer-events-none" />
            <div className="flex justify-between items-center mb-2 relative z-10"><h3 className="text-xl font-bold text-white">資料與報表</h3><button onClick={() => setSettingsModalVisible(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-3 relative z-10">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">App 應用</h4>
              <button onClick={() => { setSettingsModalVisible(false); setInstallModalVisible(true); }} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-blue-800/20 border border-blue-700/30 hover:border-blue-500/50 flex items-center justify-center gap-4 transition-all active:scale-[0.98] group"><div className="p-2 rounded-full bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform"><Smartphone size={20} /></div><div className="text-left flex-1"><div className="text-white font-bold">安裝到手機 (App)</div><div className="text-xs text-blue-200/50">將網頁變成獨立 App</div></div></button>
            </div>
            <div className="space-y-3 relative z-10">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">報表輸出</h4>
              <button onClick={exportToCSV} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border border-emerald-700/30 hover:border-emerald-500/50 flex items-center justify-center gap-4 transition-all active:scale-[0.98] group"><div className="p-2 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform"><FileSpreadsheet size={20} /></div><div className="text-left flex-1"><div className="text-white font-bold">匯出報表 (CSV)</div><div className="text-xs text-emerald-200/50">Excel 財報分析專用</div></div></button>
            </div>
            <div className="space-y-3 relative z-10">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">系統維護</h4>
              <button onClick={initializeSampleData} className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center gap-4 transition-all active:scale-[0.98]"><Cloud size={18} className="text-gold" /><div className="text-left flex-1"><div className="text-gray-200 font-bold text-sm">匯入範例資料</div><div className="text-xs text-gray-500">雲端資料庫初始化</div></div></button>
            </div>
          </div>
        </div>
      )}

      {/* Install Guide Modal */}
      {installModalVisible && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl p-6 border border-blue-500/30 bg-[#121212] shadow-2xl relative">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Smartphone className="text-blue-400" /> 安裝教學</h3><button onClick={() => setInstallModalVisible(false)} className="p-2 rounded-full hover:bg-white/10"><X size={20} className="text-gray-400" /></button></div>
            <div className="space-y-6">
              {deviceType === 'ios' ? (
                <>
                  <div className="flex items-start gap-4"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">1</div><div className="flex-1 text-gray-300 text-sm">點擊瀏覽器下方的 <span className="text-blue-400 font-bold inline-flex items-center mx-1"><Share size={14}/> 分享按鈕</span></div></div>
                  <div className="flex items-start gap-4"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">2</div><div className="flex-1 text-gray-300 text-sm">往下滑動選單，找到並點選 <span className="text-white font-bold border border-white/20 px-1 rounded mx-1">加入主畫面</span></div></div>
                  <div className="flex items-start gap-4"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">3</div><div className="flex-1 text-gray-300 text-sm">點擊右上角的「新增」，App 圖示就會出現在您的桌面上！</div></div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-4"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">1</div><div className="flex-1 text-gray-300 text-sm">點擊瀏覽器右上角的 <span className="text-blue-400 font-bold inline-flex items-center mx-1"><MoreVertical size={14}/> 選單</span></div></div>
                  <div className="flex items-start gap-4"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">2</div><div className="flex-1 text-gray-300 text-sm">選擇 <span className="text-white font-bold border border-white/20 px-1 rounded mx-1">加到主畫面</span> 或 <span className="text-white font-bold border border-white/20 px-1 rounded mx-1">安裝應用程式</span></div></div>
                  <div className="flex items-start gap-4"><div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">3</div><div className="flex-1 text-gray-300 text-sm">確認後，App 圖示就會出現在您的桌面上！</div></div>
                </>
              )}
            </div>
            <button onClick={() => setInstallModalVisible(false)} className="w-full mt-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors">我知道了</button>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md animate-fade-in p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#18181b] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#18181b] z-20 rounded-t-3xl"><h3 className="text-xl font-bold text-white flex items-center gap-2">{modalMode === 'add' ? <Plus size={20} className="text-yellow-500"/> : <Edit2 size={18} className="text-yellow-500"/>}{modalMode === 'add' ? '新增項目' : '編輯詳情'}</h3><button onClick={() => setModalVisible(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X size={20} className="text-gray-400" /></button></div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-5">
                 {activeTab === 'ingredients' && (
                    <div className="flex gap-2 mb-2">
                      <button onClick={() => setFormCategory('ingredient')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${formCategory === 'ingredient' ? 'bg-blue-900/40 border-blue-500/50 text-blue-300' : 'bg-transparent border-white/10 text-gray-500'}`}>食材</button>
                      <button onClick={() => setFormCategory('packaging')} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${formCategory === 'packaging' ? 'bg-pink-900/40 border-pink-500/50 text-pink-300' : 'bg-transparent border-white/10 text-gray-500'}`}>包材</button>
                    </div>
                 )}
                 <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">名稱</label><input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={activeTab==='ingredients' ? "例如: 6吋蛋糕盒" : "食譜名稱..."} className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-yellow-500/50 outline-none transition-colors" /></div>
                 
                 {/* 供應商欄位 (新增) */}
                 {activeTab === 'ingredients' && (
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Truck size={12}/> 供應商 (選填)</label>
                      <input value={formSupplier} onChange={(e) => setFormSupplier(e.target.value)} placeholder="例如: Costco, 食品行..." className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-yellow-500/50 outline-none transition-colors" />
                   </div>
                 )}

                 {activeTab === 'recipes' && (
                   <div className="space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">產品分類</label><div className="relative"><select value={formProductCategory} onChange={(e) => setFormProductCategory(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-yellow-500/50 appearance-none transition-colors">{PRODUCT_CATEGORIES.filter(c => c.id !== 'all').map(cat => (<option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>))}</select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} /></div></div>
                 )}
                 <div className="flex gap-4">
                   <div className="flex-1 space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{activeTab === 'recipes' ? '目標售價' : '進貨價'}</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span><input type="number" value={formPrice} onChange={(e) => handlePriceChange(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white font-bold outline-none focus:border-yellow-500/50" /></div></div>
                   {activeTab === 'recipes' ? (<div className="flex-1 space-y-2"><label className="text-xs font-bold text-emerald-500 uppercase tracking-wider">目標毛利</label><div className="relative"><input type="number" value={formProfitMargin} onChange={(e) => handleMarginChange(e.target.value)} placeholder="30" className="w-full bg-black/30 border border-emerald-500/30 rounded-xl py-3 px-4 text-white outline-none focus:border-emerald-500" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span></div></div>) : (<div className="w-1/3 space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">單位</label><div className="relative"><select value={formUnit} onChange={(e) => setFormUnit(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-4 pr-8 text-white text-center outline-none focus:border-yellow-500/50 appearance-none transition-colors"><option value="" disabled>選擇</option>{UNIT_OPTIONS.map(group => (<optgroup key={group.label} label={group.label}>{group.options.map(u => <option key={u} value={u}>{u}</option>)}</optgroup>))}</select><div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><ChevronDown size={14} /></div></div></div>)}
                 </div>
                 {activeTab === 'recipes' && (<div className="flex gap-4"><div className="flex-1 space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider text-yellow-500/80">預計產出</label><div className="relative"><input type="number" value={formYield} onChange={(e) => setFormYield(e.target.value)} placeholder="1" className="w-full bg-black/30 border border-yellow-500/30 rounded-xl py-3 px-4 text-white outline-none focus:border-yellow-500" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">份</span></div></div><div className="flex-1"></div></div>)}
                 {activeTab === 'recipes' && (<div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2"><label className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1"><DollarSign size={12}/> 隱形成本 (總計)</label><input type="number" value={formOtherCost} onChange={(e) => setFormOtherCost(e.target.value)} placeholder="0" className="w-full bg-black/30 border border-transparent rounded-lg py-2 px-3 text-white outline-none focus:border-pink-500/50 text-sm" /><p className="text-[10px] text-gray-500">包含水電、瓦斯、人力工時等難以單獨計算的雜支</p></div>)}
                 {activeTab === 'ingredients' && (<div className="flex gap-4"><div className="flex-1 space-y-2"><label className="text-xs font-bold text-gray-500 uppercase tracking-wider">進貨量</label><input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-yellow-500/50" /></div><div className="w-1/3"></div></div>)}
              </div>
              {activeTab === 'recipes' && (
                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-end mb-4"><h4 className="text-sm font-bold text-white uppercase tracking-wider">配方原料</h4><div className="text-right text-xs"><div className="text-gray-500">總成本預估</div><div className="text-lg font-bold text-white font-mono">${(currentEditingMaterialCost + (Number(formOtherCost)||0)).toFixed(0)}</div></div></div>
                  <div className="flex gap-2 mb-4">
                    <select value={selectedIngredientId} onChange={(e) => setSelectedIngredientId(e.target.value)} className="flex-1 bg-black/30 text-white text-sm rounded-lg px-3 outline-none border border-white/10 h-10 focus:border-white/30"><option value="">選擇原料...</option>
                      <optgroup label="🥕 食材">{sortedAllIngredients.filter(i => (!i.category || i.category === 'ingredient')).map(ing => (<option key={ing.id} value={ing.id}>{ing.name} {ing.supplier ? `(${ing.supplier})` : ''}</option>))}</optgroup>
                      <optgroup label="📦 包材">{sortedAllIngredients.filter(i => i.category === 'packaging').map(ing => (<option key={ing.id} value={ing.id}>{ing.name} {ing.supplier ? `(${ing.supplier})` : ''}</option>))}</optgroup>
                    </select>
                    <input type="number" placeholder="用量" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} className="w-20 bg-black/30 text-white text-sm rounded-lg px-3 outline-none border border-white/10 h-10 focus:border-white/30" />
                    <button onClick={addIngredientToRecipe} className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-lg text-sm transition-colors h-10 font-bold">+</button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {recipeIngredients.map((item, idx) => {
                      const ing = ingredients.find(i => i.id === Number(item.id));
                      if (!ing) return null;
                      return (
                        <div key={idx} className="flex justify-between items-center text-sm bg-black/20 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                          <span className="text-gray-300 font-medium flex items-center gap-2">
                             {ing.category === 'packaging' ? <Gift size={12} className="text-pink-400"/> : null}
                             {ing.name}
                             {ing.supplier && <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-0.5"><Truck size={8} />{ing.supplier}</span>}
                          </span>
                          <div className="flex items-center gap-4"><span className="text-yellow-500/80 font-mono">{item.amount} {ing.unit}</span><button onClick={() => removeIngredientFromRecipe(item.id)} className="text-gray-600 hover:text-red-400 transition-colors"><X size={14} /></button></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-white/5 flex gap-4 sticky bottom-0 bg-[#18181b] rounded-b-3xl">
              {modalMode === 'edit' && (<button onClick={handleDelete} className="p-3.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"><Trash2 size={20} /></button>)}
              <button onClick={handleSave} className="flex-1 py-3.5 rounded-xl font-bold text-sm text-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-yellow-500/20 bg-gradient-to-r from-[#D4AF37] to-[#F5D061]"><Save size={18} /> 儲存變更</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
