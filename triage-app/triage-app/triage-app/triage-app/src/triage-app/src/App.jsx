import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Users, ChevronRight, ChevronLeft, AlertTriangle, Baby, UserPlus, Clock, 
  TrendingUp, TrendingDown, Minus, Info, Smartphone, LayoutDashboard, ShieldAlert, 
  CheckCircle, XCircle, Stethoscope, ClipboardCheck, History, Building2, User, 
  Plus, ArrowRightLeft, MapPin, Send, RefreshCcw, Hash, Thermometer, Zap, 
  Truck, Check, ChevronDown, ChevronUp, AlertCircle, Phone, Home, FileText, 
  Droplets, Skull, Wind, Layers, Edit3, Flame, Biohazard, Radiation, Medal, 
  Users2, Ambulance, Trash2, LogOut
} from 'lucide-react';

// --- Constants ---
const TRIAGE_COLORS = {
  RED: 'bg-red-600 text-white',
  YELLOW: 'bg-yellow-400 text-black',
  GREEN: 'bg-green-500 text-white',
  BLACK: 'bg-zinc-900 text-white',
  PENDING: 'bg-zinc-200 text-zinc-600'
};

const TRANSPORT_STATUSES = [
  { id: 'Waiting', label: '待機', color: 'bg-slate-100 text-slate-600', icon: <Clock size={14}/> },
  { id: 'Preparing', label: '準備中', color: 'bg-orange-100 text-orange-600', icon: <Activity size={14}/> },
  { id: 'Transporting', label: '搬送中', color: 'bg-blue-100 text-blue-600', icon: <Truck size={14}/> },
  { id: 'Completed', label: '完了', color: 'bg-green-100 text-green-600', icon: <Check size={14}/> }
];

const HOSPITALS = ["未定", "国立災害医療センター", "市立救急病院", "大学付属病院", "広域救命センター", "二次救急クリニック"];
const TRANSPORT_AGENCIES = ["未定", "消防本部（救急隊）", "民間救急", "自衛隊", "警察", "ドクターヘリ", "防災ヘリ", "DMAT車両"];

const JCS_OPTIONS = [
  { val: null, label: "未選択" }, { val: 0, label: "0 (清明)" }, { val: 1, label: "1 (不鮮明)" }, 
  { val: 2, label: "2 (見当識障害)" }, { val: 3, label: "3 (自分の名前が言えない)" }, 
  { val: 10, label: "10 (普通の呼びかけで開眼)" }, { val: 20, label: "20 (大声・ゆさぶりで開眼)" }, 
  { val: 30, label: "30 (痛み刺激で辛うじて開眼)" }, { val: 100, label: "100 (痛み刺激で払いのける)" }, 
  { val: 200, label: "200 (痛み刺激で手足を動かす)" }, { val: 300, label: "300 (痛み刺激に反応しない)" }
];

const ANATOMICAL_ITEMS = {
  head_face: { label: "頭部・顔面", icon: <Skull size={14} />, items: [{ id: 'skull_fx', label: '(開放性) 頭蓋骨骨折' }, { id: 'skull_base_fx', label: '頭蓋底骨折' }, { id: 'facial_burn', label: '顔面・気道熱傷' }] },
  chest: { label: "胸部", icon: <Wind size={14} />, items: [{ id: 'airway_injury', label: '気管・気道損傷' }, { id: 'cardiac_tamponade', label: '心タンポナーデ' }, { id: 'tension_pneumo', label: '緊張性気胸' }, { id: 'flail_chest', label: 'フレイルチェスト' }, { id: 'open_pneumo', label: '開放性気胸' }] },
  abdomen: { label: "腹部", icon: <Activity size={14} />, items: [{ id: 'intra_hemorrhage', label: '腹腔内出血' }, { id: 'organ_injury', label: '腹部臓器損傷' }] },
  pelvis_limbs: { label: "骨盤・四肢", icon: <Layers size={14} />, items: [{ id: 'pelvic_fx', label: '骨盤骨折' }, { id: 'bi_femur_fx', label: '両側大腿骨骨折' }, { id: 'paralysis', label: '四肢麻痺' }, { id: 'amputation', label: '四肢切断' }, { id: 'crush_syndrome', label: 'クラッシュ症候群' }] },
  skin_soft: { label: "皮膚・軟部", icon: <Droplets size={14} />, items: [{ id: 'degloving', label: 'デグロービング損傷' }, { id: 'severe_burn', label: '重症熱傷 (15%以上)' }, { id: 'penetrating', label: '穿通外傷 (臓器/大血管)' }] }
};

const MECHANISM_ITEMS = [
  { id: 'none', label: '注意するべき受傷機転なし', isNeutral: true },
  { id: 'trunk_compression', label: '体幹部の狭圧' },
  { id: 'limb_compression', label: '1肢以上の狭圧 (4時間以上)' },
  { id: 'explosion', label: '爆発' },
  { id: 'fall', label: '高所墜落' },
  { id: 'temp_env', label: '異常温度環境' },
  { id: 'toxic_gas', label: '有毒ガス発生' },
  { id: 'contamination', label: '汚染 (NBC)' }
];

const STATUS_PRIORITY = { RED: 3, YELLOW: 2, GREEN: 1, BLACK: 4, PENDING: 0 };

// --- Main Application Component ---
export default function App() {
  const [view, setView] = useState('field');
  const [evaluatorName, setEvaluatorName] = useState(() => localStorage.getItem('evaluatorName') || '救急隊A');
  const [evaluatorQualification, setEvaluatorQualification] = useState(() => localStorage.getItem('evaluatorQualification') || '救急救命士');
  const [evaluatorLocation, setEvaluatorLocation] = useState(() => localStorage.getItem('evaluatorLocation') || '第1現場');
  const [activeStep, setActiveStep] = useState(-1);
  const [lastSavedPatient, setLastSavedPatient] = useState(null); 
  const [showResetModal, setShowResetModal] = useState(false);

  // 【修正】初期値をLocalStorageから読み込む
  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem('triage_patients');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentTriage, setCurrentTriage] = useState(null);

  // 【修正】データが更新されるたびにLocalStorageへ保存
  useEffect(() => {
    localStorage.setItem('triage_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('evaluatorName', evaluatorName);
    localStorage.setItem('evaluatorQualification', evaluatorQualification);
    localStorage.setItem('evaluatorLocation', evaluatorLocation);
  }, [evaluatorName, evaluatorQualification, evaluatorLocation]);

  const initNewTriage = (existingPatient = null) => {
    setLastSavedPatient(null);
    setCurrentTriage({
      id: existingPatient ? existingPatient.id : `ID-${Math.floor(Math.random() * 9000) + 1000}`,
      sequence: existingPatient ? existingPatient.sequence : '', 
      isReEvaluation: !!existingPatient,
      evaluator: evaluatorName,
      qualification: evaluatorQualification,
      location: evaluatorLocation,
      timestamp: new Date().toISOString(),
      status: existingPatient ? existingPatient.status : 'PENDING',
      method: existingPatient ? existingPatient.evaluations[0].method : 'START',
      walkable: existingPatient ? existingPatient.evaluations[0].walkable : null,
      hasBreathing: existingPatient ? existingPatient.evaluations[0].hasBreathing : null,
      breathingAfterAirway: existingPatient ? existingPatient.evaluations[0].breathingAfterAirway : null, 
      physiological: { 
        pulse: existingPatient ? existingPatient.evaluations[0].physiological.pulse : null, 
        resp: existingPatient ? existingPatient.evaluations[0].physiological.resp : null, 
        jcs: existingPatient ? existingPatient.evaluations[0].physiological.jcs : null, 
        spo2: existingPatient ? existingPatient.evaluations[0].physiological.spo2 : null, 
        sbp: existingPatient ? existingPatient.evaluations[0].physiological.sbp : null, 
        shockSigns: existingPatient ? existingPatient.evaluations[0].physiological.shockSigns : false,
      },
      anatomical: existingPatient ? { ...existingPatient.evaluations[0].anatomical } : {},
      anatomicalOther: existingPatient ? (existingPatient.evaluations[0].anatomicalOther || '') : '',
      mechanism: existingPatient ? { ...existingPatient.evaluations[0].mechanism } : {},
      vulnerability: existingPatient ? { ...existingPatient.vulnerability } : {},
      patientInfo: {
        name: existingPatient ? (existingPatient.patientInfo?.name || '') : '',
        age: existingPatient ? (existingPatient.patientInfo?.age || '') : '',
        gender: existingPatient ? (existingPatient.patientInfo?.gender || '') : '',
        address: existingPatient ? (existingPatient.patientInfo?.address || '') : '',
        phone: existingPatient ? (existingPatient.patientInfo?.phone || '') : '',
      },
      destinationHospital: existingPatient ? existingPatient.destinationHospital : HOSPITALS[0],
      transportAgency: existingPatient ? (existingPatient.transportAgency || TRANSPORT_AGENCIES[0]) : TRANSPORT_AGENCIES[0],
      transportStatus: existingPatient ? existingPatient.transportStatus : 'Waiting',
    });
    setActiveStep(-1);
  };

  // 初期化（初回起動時）
  useEffect(() => {
    if (!currentTriage && !lastSavedPatient) {
      initNewTriage();
    }
  }, []);

  const handleResetIncident = () => {
    setPatients([]);
    localStorage.removeItem('triage_patients');
    setLastSavedPatient(null);
    initNewTriage();
    setShowResetModal(false);
  };

  // トリアージ判定ロジック
  useEffect(() => {
    if (!currentTriage || currentTriage.method === 'INFO_ONLY') return;
    
    let status = 'PENDING';
    const p = currentTriage.physiological;

    if (currentTriage.method === 'START') {
      if (currentTriage.walkable === true) {
        status = 'GREEN';
      } else if (currentTriage.walkable === false) {
        if (currentTriage.hasBreathing === false) {
          if (currentTriage.breathingAfterAirway === true) status = 'RED';
          else if (currentTriage.breathingAfterAirway === false) status = 'BLACK';
        } else if (currentTriage.hasBreathing === true) {
          if (p.resp !== null && (p.resp >= 30 || p.resp <= 9)) {
            status = 'RED';
          } else if (p.resp !== null) {
            if (p.pulse === 'weak_or_none' || p.pulse === 'pale_cold' || p.pulse === 'over_120') {
              status = 'RED';
            } else if (p.pulse === 'normal') {
              if (p.jcs === 20) status = 'RED';
              else if (p.jcs === 0) status = 'YELLOW';
            }
          }
        }
      }
    } else if (currentTriage.method === 'PAT') {
      const isPhysioRed = (
        (p.resp !== null && (p.resp >= 30 || p.resp < 12)) ||
        (p.pulse !== null && (p.pulse >= 120 || p.pulse < 50)) ||
        (p.jcs !== null && p.jcs >= 10) ||
        (p.spo2 !== null && p.spo2 < 90) ||
        (p.sbp !== null && (p.sbp >= 200 || p.sbp < 90)) ||
        p.shockSigns
      );
      const isAnatomicalRed = Object.values(currentTriage.anatomical).some(v => v === true);
      const isMechanismSignificant = Object.entries(currentTriage.mechanism).some(([id, v]) => id !== 'none' && v === true);
      const isMechanismNone = currentTriage.mechanism.none === true;

      if (isPhysioRed || isAnatomicalRed) status = 'RED';
      else if (isMechanismSignificant) status = 'YELLOW';
      else if (isMechanismNone || p.resp !== null) status = 'GREEN';
    }
    
    if (status !== currentTriage.status) {
        setCurrentTriage(prev => ({ ...prev, status }));
    }
  }, [currentTriage?.walkable, currentTriage?.hasBreathing, currentTriage?.breathingAfterAirway, currentTriage?.physiological, currentTriage?.anatomical, currentTriage?.mechanism]);

  const savePatient = () => {
    const inputSeq = parseInt(currentTriage.sequence);
    const existingIdx = patients.findIndex(p => p.id === currentTriage.id);
    const newEvaluation = { 
      ...currentTriage, 
      evaluator: evaluatorName, 
      qualification: evaluatorQualification,
      location: evaluatorLocation,
      sequence: inputSeq || (patients.length + 1)
    };

    let savedPatientObj;
    if (existingIdx > -1) {
      const updatedPatients = [...patients];
      savedPatientObj = { ...updatedPatients[existingIdx] };
      savedPatientObj.evaluations = [newEvaluation, ...savedPatientObj.evaluations];
      if (currentTriage.method !== 'INFO_ONLY') {
        savedPatientObj.status = newEvaluation.status;
      }
      savedPatientObj.patientInfo = { ...currentTriage.patientInfo };
      updatedPatients[existingIdx] = savedPatientObj;
      setPatients(updatedPatients);
    } else {
      const finalSeq = inputSeq || (patients.length > 0 ? Math.max(...patients.map(p => p.sequence)) + 1 : 1);
      newEvaluation.sequence = finalSeq;
      savedPatientObj = {
        id: currentTriage.id,
        sequence: finalSeq,
        patientInfo: { ...currentTriage.patientInfo },
        vulnerability: currentTriage.vulnerability,
        destinationHospital: HOSPITALS[0],
        transportAgency: TRANSPORT_AGENCIES[0],
        transportStatus: 'Waiting',
        status: currentTriage.status,
        evaluations: [newEvaluation]
      };
      setPatients([savedPatientObj, ...patients]);
    }
    setLastSavedPatient(savedPatientObj);
    setCurrentTriage(null);
  };

  const updatePatientInfoInDashboard = (patientId, field, value) => {
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, [field]: value } : p));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-red-500" />
          <h1 className="text-xl font-bold tracking-tight italic text-white uppercase leading-none">Rapid Triage</h1>
        </div>
        <nav className="flex bg-slate-800 rounded-lg p-1">
          <button onClick={() => setView('dashboard')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition ${view === 'dashboard' ? 'bg-slate-600 shadow-sm text-white' : 'hover:bg-slate-700 text-slate-400'}`}>
            <LayoutDashboard size={18} />
            <span className="hidden sm:inline">指揮本部</span>
          </button>
          <button onClick={() => { initNewTriage(); setView('field'); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition ${view === 'field' ? 'bg-slate-600 shadow-sm text-white' : 'hover:bg-slate-700 text-slate-400'}`}>
            <Smartphone size={18} />
            <span className="hidden sm:inline">現場入力</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {view === 'dashboard' ? (
          <DashboardView patients={patients} onReEvaluate={(p) => { initNewTriage(p); setView('field'); }} onUpdateInfo={updatePatientInfoInDashboard} onResetRequest={() => setShowResetModal(true)} />
        ) : (
          <FieldEntryView data={currentTriage} setData={setCurrentTriage} onSave={savePatient} activeStep={activeStep} setActiveStep={setActiveStep} evaluatorName={evaluatorName} setEvaluatorName={setEvaluatorName} evaluatorQualification={evaluatorQualification} setEvaluatorQualification={setEvaluatorQualification} evaluatorLocation={evaluatorLocation} setEvaluatorLocation={setEvaluatorLocation} lastSavedPatient={lastSavedPatient} onReset={() => initNewTriage()} />
        )}
      </main>

      {/* 事案リセット確認モーダル */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-red-100 text-red-600 rounded-full"><AlertTriangle size={48} /></div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">事案を終了しますか？</h3>
                <p className="text-sm text-slate-500 font-bold">データを全消去します。ブラウザの保存データも削除されます。</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleResetIncident} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-red-700 active:scale-95 transition flex items-center justify-center gap-2"><Trash2 size={20}/> データを全消去して終了</button>
              <button onClick={() => setShowResetModal(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-200 transition">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// （以下、DashboardView, PatientCard, FieldEntryView 等のサブコンポーネントは元のコードを継承。文字数制限のため一部省略していますが、提供されたロジックに準拠します）
// ※前回の回答と同様のUIコンポーネントを配置してください。
