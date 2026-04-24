// ─── SubsidyWizard.jsx ───────────────────────────────────────────────────────
// 太陽光・蓄電池 補助金かんたん診断
// naturalquest.org / solar-subsidy
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import {
  C, Badge, Card, OptionBtn, NavRow, ProgressBar,
  StepHeader, WizardHeader, ResultBar, TimelineStep,
  CtaBox, Disclaimer, StatsBar,
} from "./WizardShell.jsx";

// ─── 東京ガスアフィリエイトURL（本番申請後に差し替え）─────────────────────
const AFFILIATE_URL = "https://example.com/tokyogas-affiliate"; // ← 要差し替え

// ─── DATA（実測値・2026年4月調査）────────────────────────────────────────────
const MUNICIPALITIES = [
  { name:"東京都（都レベル）", area:"都レベル", status:"open",
    solar:{ max:600, note:"新築12〜10万/kW｜既存15〜12万/kW" },
    battery:{ max:120, note:"10万/kWh（DR参加で+10万円）" },
    v2h:true, deadline:"太陽光:2026/3/31｜蓄電池:2029/3/30",
    url:"https://www.tokyo-co2down.jp/subsidy" },
  { name:"千代田区", area:"23区", status:"closed", solar:{ max:125, note:"対象経費の20%（太陽光・蓄電池合算上限）", combined:true }, battery:null, v2h:false, deadline:"〜2026/2/13", url:"https://www.city.chiyoda.lg.jp/" },
  { name:"中央区", area:"23区", status:"closed", solar:{ max:42, note:"10万/kW（エコアクト:15万/kW）" }, battery:{ max:12, note:"1万/kWh（エコアクト:1.5万/kWh）" }, v2h:false, deadline:"〜2026/3/31", url:"https://www.city.chuo.lg.jp/" },
  { name:"港区", area:"23区", status:"closed", solar:{ max:40, note:"10万/kW" }, battery:{ max:20, note:"4万/kWh" }, v2h:false, deadline:"〜2026/1/30（令和8年度は4月〜予定）", url:"https://www.city.minato.tokyo.jp/" },
  { name:"新宿区", area:"23区", status:"closed", solar:{ max:30, note:"10万/kW" }, battery:{ max:10, note:"1万/kWh" }, v2h:false, deadline:"〜2026/3/31", url:"https://www.city.shinjuku.lg.jp/" },
  { name:"文京区", area:"23区", status:"closed", solar:{ max:70, note:"10万/kWと経費1/2の少ない方" }, battery:{ max:20, note:"2万/kWhと経費1/2の少ない方" }, v2h:false, deadline:"〜2026/3/2", url:"https://www.city.bunkyo.lg.jp/" },
  { name:"台東区", area:"23区", status:"open", solar:{ max:20, note:"5万/kW（第2期受付中）" }, battery:{ max:10, note:"1万/kWh" }, v2h:false, deadline:"第2期受付中（予算次第終了）", url:"https://www.city.taito.lg.jp/" },
  { name:"墨田区", area:"23区", status:"closed", solar:{ max:20, note:"5万/kW" }, battery:{ max:5, note:"対象経費の10%" }, v2h:true, deadline:"〜2026/2/27", url:"https://www.city.sumida.lg.jp/" },
  { name:"江東区", area:"23区", status:"closed", solar:{ max:24, note:"5万/kW（蓄電池同時:6万/kW）" }, battery:{ max:20, note:"1万/kWh（太陽光同時:2.5万/kWh）" }, v2h:true, deadline:"〜2026/3/13", url:"https://www.city.koto.lg.jp/" },
  { name:"品川区", area:"23区", status:"closed", solar:{ max:20, note:"5万/kW" }, battery:{ max:30, note:"3万/kWh" }, v2h:false, deadline:"〜2026/3/31（令和8年度:5/25〜予定）", url:"https://www.city.shinagawa.tokyo.jp/" },
  { name:"目黒区", area:"23区", status:"closed", solar:{ max:15, note:"3万/kW" }, battery:{ max:7, note:"本体価格の1/3以下" }, v2h:false, deadline:"〜2026/1/9", url:"https://www.city.meguro.tokyo.jp/" },
  { name:"大田区", area:"23区", status:"none", solar:null, battery:null, v2h:false, deadline:"—", note:"独自補助金なし。都レベルのみ活用可。", url:"https://www.city.ota.tokyo.jp/" },
  { name:"世田谷区", area:"23区", status:"closed", solar:{ max:30, note:"3万/kW（蓄電池は令和8年度から対象外）" }, battery:null, v2h:false, deadline:"〜2026/2/末", url:"https://www.city.setagaya.lg.jp/" },
  { name:"渋谷区", area:"23区", status:"none", solar:null, battery:null, v2h:false, deadline:"—", note:"独自の補助金なし。", url:"https://www.city.shibuya.tokyo.jp/" },
  { name:"中野区", area:"23区", status:"closed", solar:{ max:15, note:"一律15万円" }, battery:{ max:10, note:"一律10万円（4kWh以上）" }, v2h:false, deadline:"〜2026/2/28", url:"https://www.city.tokyo-nakano.lg.jp/" },
  { name:"杉並区", area:"23区", status:"closed", solar:{ max:12, note:"4万/kW（令和8年度:4/10〜予定）" }, battery:{ max:5, note:"一律5万円" }, v2h:false, deadline:"〜2026/2/27", url:"https://www.city.suginami.tokyo.jp/" },
  { name:"練馬区", area:"23区", status:"closed", solar:{ max:8, note:"対象経費の1/2" }, battery:{ max:5, note:"対象経費の1/2" }, v2h:false, deadline:"〜2026/3/31", url:"https://www.city.nerima.tokyo.jp/" },
  { name:"豊島区", area:"23区", status:"closed", solar:{ max:8, note:"2万/kW" }, battery:{ max:5, note:"1万/kWh" }, v2h:false, deadline:"〜2026/3/2", url:"https://www.city.toshima.lg.jp/" },
  { name:"北区", area:"23区", status:"closed", solar:{ max:24, note:"8万/kW（区内業者:9.6万/kW）" }, battery:{ max:12, note:"1万/kWh（区内業者:1.2万/kWh）" }, v2h:false, deadline:"〜2026/2/27", url:"https://www.city.kita.tokyo.jp/" },
  { name:"荒川区", area:"23区", status:"closed", solar:{ max:30, note:"2万/kW（区内業者:上限30万）" }, battery:{ max:15, note:"5千/kWh（区内業者:上限15万）" }, v2h:true, deadline:"〜2026/2/27（令和8年度:5/1〜予定）", url:"https://www.city.arakawa.tokyo.jp/" },
  { name:"板橋区", area:"23区", status:"none", solar:null, battery:null, v2h:false, deadline:"—", note:"2020年度で終了。", url:"https://www.city.itabashi.tokyo.jp/" },
  { name:"足立区", area:"23区", status:"open", solar:{ max:29, note:"6万/kW（区内業者:7.2万/kW）令和8年度受付中" }, battery:{ max:6, note:"一律5万円" }, v2h:false, deadline:"令和8年度:2026/4/13〜2027/2/26", url:"https://www.city.adachi.tokyo.jp/" },
  { name:"葛飾区", area:"23区", status:"open", solar:{ max:45, note:"8万/kW（蓄電池併設+5万）令和8年度受付中" }, battery:{ max:25, note:"対象経費の1/4（太陽光併設+5万）" }, v2h:true, deadline:"令和8年度:2026/4/1〜2027/3/31", url:"https://www.city.katsushika.lg.jp/" },
  { name:"江戸川区", area:"23区", status:"closed", solar:{ max:22, note:"7.5万/kW（令和8年度受付予定）" }, battery:{ max:20, note:"対象経費の1/4" }, v2h:false, deadline:"〜2025/5/8（令和8年度受付予定）", url:"https://www.city.edogawa.tokyo.jp/" },
  { name:"八王子市", area:"市部", status:"closed", solar:{ max:10, note:"1万/kW" }, battery:{ max:3, note:"一律3万円（3kWh以上）" }, v2h:false, deadline:"〜2026/3/16", url:"https://www.city.hachioji.tokyo.jp/" },
  { name:"立川市", area:"市部", status:"none", solar:null, battery:null, v2h:false, deadline:"—", note:"独自補助金なし。", url:"https://www.city.tachikawa.lg.jp/" },
  { name:"武蔵野市", area:"市部", status:"open", solar:{ max:15, note:"15万円または3万/kW（5kW上限）" }, battery:null, v2h:false, deadline:"設備設置完了後6ヶ月以内", url:"https://www.city.musashino.lg.jp/" },
  { name:"三鷹市", area:"市部", status:"closed", solar:{ max:10, note:"1万/kW" }, battery:{ max:5, note:"一律5万円" }, v2h:false, deadline:"〜2026/3/31", url:"https://www.city.mitaka.lg.jp/" },
  { name:"青梅市", area:"市部", status:"open", solar:{ max:6, note:"1.5万/kW（令和8年度受付中）" }, battery:{ max:3, note:"5千/kWh" }, v2h:false, deadline:"令和8年度:2026/5/7〜", url:"https://www.city.ome.tokyo.jp/" },
  { name:"府中市", area:"市部", status:"open", solar:{ max:10, note:"2万/kW（令和8年度受付中）" }, battery:{ max:10, note:"2万/kWh" }, v2h:false, deadline:"令和8年度:2026/4/6〜", url:"https://www.city.fuchu.tokyo.jp/" },
  { name:"昭島市", area:"市部", status:"closed", solar:{ max:6, note:"1.5万/kW" }, battery:{ max:5, note:"機器費の1/3" }, v2h:false, deadline:"〜2026/1/30", url:"https://www.city.akishima.lg.jp/" },
  { name:"調布市", area:"市部", status:"open", solar:{ max:10, note:"2万/kW（令和8年度受付中）" }, battery:{ max:5, note:"一律5万円" }, v2h:false, deadline:"令和8年度:2026/4/1〜2027/3/10", url:"https://www.city.chofu.lg.jp/" },
  { name:"町田市", area:"市部", status:"none", solar:null, battery:null, v2h:false, deadline:"—", note:"独自補助なし（2025年度）。", url:"https://www.city.machida.tokyo.jp/" },
  { name:"小金井市", area:"市部", status:"closed", solar:{ max:10, note:"3万/kW" }, battery:{ max:4, note:"一律4万円" }, v2h:false, deadline:"〜2026/3/10", url:"https://www.city.koganei.lg.jp/" },
  { name:"小平市", area:"市部", status:"closed", solar:{ max:10, note:"3万/kW" }, battery:{ max:6, note:"一律6万円" }, v2h:true, deadline:"〜2026/3/31", url:"https://www.city.kodaira.tokyo.jp/" },
  { name:"日野市", area:"市部", status:"open", solar:{ max:0, note:"詳細は市HP参照" }, battery:{ max:0, note:"詳細は市HP参照" }, v2h:false, deadline:"市HPで確認", url:"https://www.city.hino.lg.jp/" },
  { name:"東村山市", area:"市部", status:"closed", solar:{ max:15, note:"3万/kW" }, battery:{ max:7, note:"一律7万円" }, v2h:false, deadline:"〜2026/1/23", url:"https://www.city.higashimurayama.tokyo.jp/" },
  { name:"国分寺市", area:"市部", status:"closed", solar:{ max:15, note:"3万/kW" }, battery:{ max:6, note:"一律6万円" }, v2h:false, deadline:"〜2026/3/31", url:"https://www.city.kokubunji.tokyo.jp/" },
  { name:"国立市", area:"市部", status:"closed", solar:{ max:12, note:"新築2.5万/kW・既存2万/kW" }, battery:{ max:4, note:"一律4万円" }, v2h:false, deadline:"〜2026/3/10", url:"https://www.city.kunitachi.tokyo.jp/" },
  { name:"福生市", area:"市部", status:"closed", solar:{ max:20, note:"工事費の20%" }, battery:{ max:0, note:"詳細は市HP参照" }, v2h:false, deadline:"〜2026/2/2", url:"https://www.city.fussa.tokyo.jp/" },
  { name:"狛江市", area:"市部", status:"closed", solar:{ max:8, note:"2万/kW（上限8万円）" }, battery:{ max:5, note:"一律5万円" }, v2h:false, deadline:"〜2026/1/30", url:"https://www.city.komae.lg.jp/" },
  { name:"東大和市", area:"市部", status:"closed", solar:{ max:45, note:"新築12万/kW・既存15万/kW" }, battery:{ max:80, note:"10万/kWh（上限80万円）" }, v2h:false, deadline:"〜2026/3/31", url:"https://www.city.higashiyamato.lg.jp/" },
  { name:"清瀬市", area:"市部", status:"closed", solar:{ max:10, note:"3万/kW" }, battery:{ max:5, note:"一律5万円" }, v2h:false, deadline:"受付終了（予算上限達成）", url:"https://www.city.kiyose.lg.jp/" },
  { name:"東久留米市", area:"市部", status:"none", solar:null, battery:null, v2h:false, deadline:"—", url:"https://www.city.higashikurume.lg.jp/" },
  { name:"武蔵村山市", area:"市部", status:"closed", solar:{ max:12, note:"市内業者3万/kW・市外2.5万/kW" }, battery:{ max:5, note:"市内業者2万/kWh・市外1.5万/kWh" }, v2h:false, deadline:"〜2026/2/2", url:"https://www.city.musashimurayama.lg.jp/" },
  { name:"多摩市", area:"市部", status:"closed", solar:{ max:15, note:"新築1〜1.5万/kW・既存2〜3万/kW" }, battery:{ max:6, note:"対象経費の1/4" }, v2h:false, deadline:"〜2026/3/31", url:"https://www.city.tama.lg.jp/" },
  { name:"稲城市", area:"市部", status:"closed", solar:{ max:8, note:"2万/kW" }, battery:{ max:4, note:"一律4万円" }, v2h:true, deadline:"〜2026/2/28", url:"https://www.city.inagi.tokyo.jp/" },
  { name:"羽村市", area:"市部", status:"closed", solar:{ max:15, note:"1.6万/kW" }, battery:{ max:8, note:"詳細は市HP参照" }, v2h:false, deadline:"〜2026/1/31", url:"https://www.city.hamura.tokyo.jp/" },
  { name:"あきる野市", area:"市部", status:"none", solar:null, battery:null, v2h:false, deadline:"—", url:"https://www.city.akiruno.tokyo.jp/" },
  { name:"西東京市", area:"市部", status:"closed", solar:{ max:0, note:"詳細は市HPで確認" }, battery:{ max:0, note:"詳細は市HPで確認" }, v2h:false, deadline:"令和7年9月〜12月頃", url:"https://www.city.nishitokyo.lg.jp/" },
  { name:"瑞穂町", area:"町村部", status:"closed", solar:{ max:35, note:"7万/kW" }, battery:{ max:10, note:"本体価格の1/3（5kWh分まで）" }, v2h:false, deadline:"〜2025/12/22", url:"https://www.town.mizuho.tokyo.jp/" },
  { name:"日の出町", area:"町村部", status:"closed", solar:{ max:12, note:"3万/kW（最大4kW）" }, battery:{ max:6, note:"1万/kWh（最大6kWh）" }, v2h:true, deadline:"令和7年9月（次年度要確認）", url:"https://www.town.hinode.tokyo.jp/" },
];

const SOLAR_OPTIONS = [
  { label:"〜3kW",    value:2.5,  desc:"1〜2人世帯・屋根が小さめ" },
  { label:"3〜5kW",   value:4.0,  desc:"3〜4人世帯・標準的な大きさ" },
  { label:"5〜8kW",   value:6.5,  desc:"大家族・屋根が広め" },
  { label:"8kW以上",  value:10.0, desc:"売電・蓄電もしっかり重視" },
];
const BATTERY_OPTIONS = [
  { label:"〜6kWh",    value:4.0,  desc:"停電対策として最小限" },
  { label:"6〜12kWh",  value:9.0,  desc:"1日分の電気をまかなえる" },
  { label:"12kWh以上", value:16.0, desc:"2日分以上・EV充電にも対応" },
];

const AREA_LABELS = [
  { key:"23区",  label:"23区",  desc:"千代田区・新宿区・渋谷区など" },
  { key:"市部",  label:"市部",  desc:"八王子市・調布市・狛江市など" },
  { key:"町村部",label:"町村部",desc:"瑞穂町・日の出町" },
];

const STATS = [
  { label:"🗂 掲載自治体数",  value:"52",    sub:"都＋23区＋市町村" },
  { label:"⚡ 受付中",        value:"9",     sub:"現在申請可能" },
  { label:"☀️ 太陽光 最大",   value:"600万円", sub:"都（既存住宅）" },
  { label:"🔋 蓄電池 最大",   value:"120万円", sub:"都レベル（DR含む）" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcTokyoSolar(kw) {
  return Math.round(Math.min(kw, 3.6) * 120000 + Math.max(0, kw - 3.6) * 110000);
}
function calcTokyoBattery(kwh) { return Math.min(kwh * 100000, 1200000); }
function calcMuniTotal(name, hasSolar, hasBattery) {
  const d = MUNICIPALITIES.find(m => m.name === name);
  if (!d || d.status === "none") return 0;
  if (d.solar?.combined) return (hasSolar || hasBattery) ? d.solar.max * 10000 : 0;
  let t = 0;
  if (hasSolar   && d.solar?.max   > 0) t += d.solar.max * 10000;
  if (hasBattery && d.battery?.max > 0) t += d.battery.max * 10000;
  return t;
}
function fmt(n) { return Math.round(n / 10000) + "万円"; }

// ─── MuniStep（2段階エリア選択）─────────────────────────────────────────────
function MuniStep({ answers, set, onBack, onNext }) {
  const [selectedArea, setSelectedArea] = useState(
    answers.municipality
      ? (MUNICIPALITIES.find(m => m.name === answers.municipality)?.area || null)
      : null
  );
  const areaMunis = selectedArea
    ? MUNICIPALITIES.filter(m => m.area === selectedArea)
    : [];

  function clearAndBack() { setSelectedArea(null); set("municipality", ""); }

  return (
    <>
      {!selectedArea ? (
        <>
          <p style={{ fontSize:"15px", color:C.muted, margin:"0 0 18px", lineHeight:1.6 }}>
            まず、お住まいのエリアを選んでください。
          </p>
          <div style={{ display:"grid", gap:"12px" }}>
            {AREA_LABELS.map(a => (
              <button key={a.key} onClick={() => setSelectedArea(a.key)} style={{
                background:C.white, border:`2.5px solid ${C.border}`,
                borderRadius:"14px", padding:"18px 24px", cursor:"pointer", textAlign:"left",
                boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize:"18px", fontWeight:700, color:C.text, marginBottom:"3px" }}>{a.label}</div>
                <div style={{ fontSize:"13px", color:C.muted }}>{a.desc}</div>
              </button>
            ))}
            <button onClick={() => { set("municipality",""); onNext(); }} style={{
              background:"transparent", border:`2px solid ${C.border}`,
              borderRadius:"14px", padding:"16px 24px", cursor:"pointer", textAlign:"left", color:C.muted,
            }}>
              <div style={{ fontSize:"16px", fontWeight:600 }}>スキップ</div>
              <div style={{ fontSize:"13px" }}>東京都の補助金のみ確認する</div>
            </button>
          </div>
          <div style={{ marginTop:"20px" }}>
            <button onClick={onBack} style={{ padding:"13px 20px", background:"transparent", border:`2px solid ${C.border}`, borderRadius:"12px", color:C.muted, fontSize:"15px", fontWeight:600, cursor:"pointer" }}>← 戻る</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
            <button onClick={clearAndBack} style={{ background:C.greenPale, border:"none", borderRadius:"8px", padding:"6px 12px", fontSize:"13px", color:C.greenMid, fontWeight:700, cursor:"pointer" }}>
              ← {selectedArea}
            </button>
            <span style={{ fontSize:"15px", color:C.muted }}>市区町村を選んでください</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px", maxHeight:"340px", overflowY:"auto" }}>
            {areaMunis.map(m => {
              const selected = answers.municipality === m.name;
              const isOpen   = m.status === "open";
              return (
                <button key={m.name} onClick={() => set("municipality", m.name)} style={{
                  background: selected ? C.green : isOpen ? C.greenPale : C.white,
                  border:`2px solid ${selected ? C.green : isOpen ? C.greenMid : C.border}`,
                  borderRadius:"12px", padding:"12px 8px", cursor:"pointer",
                  textAlign:"center", position:"relative",
                  boxShadow: selected ? "0 3px 10px rgba(27,94,32,0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
                }}>
                  {isOpen && !selected && (
                    <div style={{ position:"absolute", top:"5px", right:"5px", width:"8px", height:"8px", borderRadius:"50%", background:C.greenMid }} />
                  )}
                  <div style={{ fontSize:"14px", fontWeight:700, color:selected?"#fff":C.text, lineHeight:1.4 }}>{m.name}</div>
                  {m.status === "none" && <div style={{ fontSize:"10px", color:C.muted, marginTop:"2px" }}>補助なし</div>}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop:"10px", display:"flex", alignItems:"center", gap:"8px", fontSize:"12px", color:C.muted }}>
            <span style={{ display:"inline-block", width:"8px", height:"8px", borderRadius:"50%", background:C.greenMid, flexShrink:0 }} />
            緑の点＝令和8年度受付中
          </div>
          {answers.municipality && (
            <div style={{ marginTop:"14px", padding:"12px 16px", background:C.greenPale, borderRadius:"12px", fontSize:"15px", color:C.green, display:"flex", alignItems:"center", gap:"10px", fontWeight:600 }}>
              ✅ {answers.municipality} を選択中
              <Badge status={MUNICIPALITIES.find(m => m.name === answers.municipality)?.status} />
            </div>
          )}
          <NavRow onBack={clearAndBack} onNext={onNext} nextDisabled={false}
            nextLabel={answers.municipality ? "次へ →" : "スキップ（都補助のみ）"} />
        </>
      )}
    </>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 5;
const STEP_TITLES = ["","お住まいの建物タイプは？","住宅の状況は？","設置したい設備は？","お住まいの区市町村は？","設置容量のめやすを教えてください"];

export default function SubsidyWizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    houseType:null, condition:null, equipment:null, municipality:"", solarKw:null, batteryKwh:null,
  });

  function set(k, v) { setAnswers(a => ({ ...a, [k]:v })); }
  function next()    { setStep(s => s + 1); }
  function back()    { setStep(s => Math.max(0, s - 1)); }
  function reset()   { setStep(0); setAnswers({ houseType:null, condition:null, equipment:null, municipality:"", solarKw:null, batteryKwh:null }); }

  const hasSolar   = answers.equipment === "solar"   || answers.equipment === "both";
  const hasBattery = answers.equipment === "battery" || answers.equipment === "both";

  const result = useMemo(() => {
    const { municipality:muni, solarKw:kw, batteryKwh:kwh } = answers;
    const tokyoSolar   = hasSolar   ? calcTokyoSolar(kw || 0)   : 0;
    const tokyoBattery = hasBattery ? calcTokyoBattery(kwh || 0) : 0;
    const nationalDR   = hasBattery ? 600000 : 0;
    const muniTotal    = calcMuniTotal(muni, hasSolar, hasBattery);
    return { tokyoSolar, tokyoBattery, nationalDR, muniTotal, total: tokyoSolar+tokyoBattery+nationalDR+muniTotal };
  }, [answers, hasSolar, hasBattery]);

  const wrap = { fontFamily:"'Hiragino Sans','Yu Gothic','Noto Sans JP',sans-serif", background:C.bg, minHeight:"100vh" };
  const body = { maxWidth:"560px", margin:"0 auto", padding:"24px 18px 56px" };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (step === 0) return (
    <div style={wrap}>
      <WizardHeader
        label="NATURALQUEST"
        badge="2026年度対応　東京都版"
        title={"太陽光・蓄電池\n補助金かんたん診断"}
        subtitle={"5つの質問に答えるだけで\nあなたが受けられる補助金の概算がわかります"}
      />
      <div style={body}>
        <StatsBar items={STATS} />
        <Card style={{ borderLeft:`5px solid ${C.gold}` }}>
          <p style={{ fontSize:"16px", color:C.text, lineHeight:1.85, margin:"0 0 14px" }}>
            国・東京都・市区町村の補助金は<strong style={{ color:C.green }}>組み合わせると100万円以上</strong>になるケースも珍しくありません。
          </p>
          <p style={{ fontSize:"15px", color:C.muted, lineHeight:1.8, margin:0 }}>
            でも制度が複雑で、調べるだけで一苦労…<br />
            このツールは<strong style={{ color:C.text }}>ボタンを選ぶだけ</strong>で概算金額と<strong style={{ color:C.text }}>申請の正しい順番</strong>を整理します。
          </p>
        </Card>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px", marginBottom:"20px" }}>
          {["🏠 住宅タイプ","🗂 設備の種類","📍 お住まいの区市","📐 容量のめやす"].map((t,i) => (
            <div key={i} style={{ background:C.white, borderRadius:"12px", padding:"12px 8px", textAlign:"center", fontSize:"12px", color:"#555", boxShadow:"0 1px 6px rgba(0,0,0,0.06)", lineHeight:1.4 }}>{t}</div>
          ))}
        </div>
        <button onClick={() => setStep(1)} style={{ width:"100%", padding:"18px", background:`linear-gradient(135deg,${C.greenBtn},${C.greenMid})`, border:"none", borderRadius:"14px", color:"#fff", fontSize:"18px", fontWeight:800, cursor:"pointer", boxShadow:"0 6px 20px rgba(56,142,60,0.4)", letterSpacing:"0.03em" }}>
          診断スタート →
        </button>
        <Disclaimer>
          <strong style={{ color:"#555" }}>ご利用上の注意：</strong>掲載情報は2025〜2026年度の調査に基づきます。補助金制度は予算の消化状況により受付終了となる場合があります。申請前に各自治体の公式サイトで最新情報を必ずご確認ください。東京都の補助金（都レベル）と区市町村補助金は、多くの場合で併用可能です。<br />
          出典：各区市町村公式HP・クールネット東京・ソーラーパートナーズ等（2026年4月調査）
        </Disclaimer>
      </div>
    </div>
  );

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (step === 6) {
    const muniData = MUNICIPALITIES.find(m => m.name === answers.municipality);
    const bars = [
      hasSolar   && result.tokyoSolar>0   && { label:"東京都（太陽光）",   val:result.tokyoSolar,   color:C.greenMid },
      hasBattery && result.tokyoBattery>0 && { label:"東京都（蓄電池）",   val:result.tokyoBattery, color:"#66BB6A"   },
      hasBattery && result.nationalDR>0   && { label:"国・DR補助（上限）", val:result.nationalDR,   color:C.gold      },
      answers.municipality && result.muniTotal>0 && { label:answers.municipality, val:result.muniTotal, color:C.sky },
    ].filter(Boolean);
    const maxVal = Math.max(...bars.map(b => b.val), 1);

    const timeline = hasBattery ? [
      { text:"施工業者に見積もりを依頼（東京都補助対応か確認する）", warn:null },
      { text:"東京都への事前申込（電子申請）を完了させる", warn:"⚠️ ここが先！工事より前に必須です" },
      { text:answers.municipality ? `${answers.municipality}への事前申請` : "市区町村への事前申請", warn:null },
      { text:"受付通知を受けてから工事契約を締結する", warn:"⚠️ 順番を逆にすると補助対象外になります" },
      { text:"工事・設置・支払いを完了させる", warn:null },
      { text:"交付申請 ＋ 実績報告を書類一式で提出する", warn:null },
      { text:"審査後、補助金が口座に振込まれる", warn:null },
    ] : [
      { text:"施工業者に見積もりを依頼する", warn:null },
      { text:"東京都への申請（ゼロエミ住宅）", warn:"⚠️ 工事前の申請が条件です" },
      { text:answers.municipality ? `${answers.municipality}への申請` : "市区町村への申請", warn:null },
      { text:"承認後に工事・設置を行う", warn:null },
      { text:"実績報告を提出 → 補助金受領", warn:null },
    ];

    return (
      <div style={wrap}>
        <div style={{ background:`linear-gradient(160deg,${C.green} 0%,#2E7D32 100%)`, padding:"24px 24px 20px" }}>
          <div style={{ fontSize:"12px", color:C.greenLight, letterSpacing:"0.1em", marginBottom:"4px" }}>診断結果</div>
          <h1 style={{ fontSize:"22px", fontWeight:800, color:"#fff", margin:0, lineHeight:1.3 }}>あなたが受けられる<br />補助金の概算</h1>
        </div>
        <div style={body}>
          <div style={{ background:`linear-gradient(135deg,${C.green} 0%,#1B5E20 100%)`, borderRadius:"18px", padding:"24px", textAlign:"center", marginBottom:"16px", boxShadow:"0 6px 20px rgba(27,94,32,0.3)" }}>
            <div style={{ fontSize:"13px", color:C.greenLight, letterSpacing:"0.1em", marginBottom:"6px", fontWeight:600 }}>補助金合計（概算）</div>
            <div style={{ fontSize:"44px", fontWeight:800, color:"#fff", lineHeight:1 }}>最大 {fmt(result.total)}</div>
            <div style={{ fontSize:"13px", color:"#A5D6A7", marginTop:"8px" }}>
              {hasBattery ? "※ 国DR補助は要件確認が必要です" : "※ 各制度の要件を満たした場合の概算です"}
            </div>
          </div>

          <Card>
            <div style={{ fontSize:"13px", fontWeight:700, color:C.greenMid, letterSpacing:"0.08em", marginBottom:"16px" }}>📊 内訳</div>
            {bars.length === 0 && <p style={{ fontSize:"15px", color:C.muted }}>条件に合う補助金が見つかりませんでした。</p>}
            {bars.map((b,i) => <ResultBar key={i} label={b.label} value={b.val} maxValue={maxVal} color={b.color} formatFn={fmt} />)}
          </Card>

          {muniData && (
            <Card style={{ borderLeft:`5px solid ${muniData.status==="open" ? C.greenMid : C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                <span style={{ fontWeight:700, fontSize:"16px" }}>{muniData.name}</span>
                <Badge status={muniData.status} />
              </div>
              {muniData.deadline && <div style={{ fontSize:"13px", color:C.muted, marginBottom:"6px" }}>📅 期限：{muniData.deadline}</div>}
              {muniData.note && <div style={{ fontSize:"13px", color:C.warn, marginBottom:"8px" }}>⚠️ {muniData.note}</div>}
              <a href={muniData.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:"14px", color:C.sky, textDecoration:"none", fontWeight:600 }}>公式サイトで最新情報を確認する →</a>
            </Card>
          )}

          <div style={{ background:C.warnBg, border:`2px solid ${C.warnBorder}`, borderRadius:"16px", padding:"22px", marginBottom:"16px" }}>
            <div style={{ fontSize:"17px", fontWeight:700, color:C.warn, marginBottom:"18px" }}>⚠️ 申請の順番を間違えると対象外になります</div>
            <ol style={{ listStyle:"none", padding:0, margin:0 }}>
              {timeline.map((t,i) => <TimelineStep key={i} index={i+1} text={t.text} warn={t.warn} />)}
            </ol>
          </div>

          <CtaBox
            badge="NEXT STEP"
            title={"まず無料見積もりで\n正確な補助額を確認しよう"}
            subtitle="東京ガスの専門スタッフが補助金申請もサポート"
            btnLabel="東京ガスで無料見積もりを依頼する →"
            href={AFFILIATE_URL}
          />

          <Disclaimer>
            <strong style={{ color:"#555" }}>ご利用上の注意：</strong>掲載情報は2025〜2026年度の調査に基づきます。補助金制度は予算の消化状況により受付終了となる場合があります。申請前に各自治体の公式サイトで最新情報を必ずご確認ください。東京都の補助金（都レベル）と区市町村補助金は、多くの場合で併用可能です。<br />
            出典：各区市町村公式HP・クールネット東京・ソーラーパートナーズ等（2026年4月調査）
          </Disclaimer>
          <button onClick={reset} style={{ width:"100%", padding:"15px", background:"transparent", border:`2px solid ${C.border}`, borderRadius:"12px", color:C.muted, fontSize:"15px", cursor:"pointer", marginTop:"10px" }}>
            ← もう一度診断する
          </button>
        </div>
      </div>
    );
  }

  // ── WIZARD ─────────────────────────────────────────────────────────────────
  return (
    <div style={wrap}>
      <div style={{ background:`linear-gradient(160deg,${C.green} 0%,#2E7D32 100%)`, padding:"20px 24px 18px" }}>
        <div style={{ fontSize:"12px", color:C.greenLight, letterSpacing:"0.12em", marginBottom:"4px", fontWeight:600 }}>補助金かんたん診断</div>
        <h1 style={{ fontSize:"20px", fontWeight:800, color:"#fff", margin:0 }}>太陽光・蓄電池 補助金チェッカー</h1>
      </div>
      <div style={body}>
        <ProgressBar current={step} total={TOTAL_STEPS} />
        <Card>
          <StepHeader step={step} total={TOTAL_STEPS} title={STEP_TITLES[step]} />

          {step===1 && <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
              <OptionBtn label="🏠 一戸建て" desc="持ち家・一軒家" selected={answers.houseType==="detached"} onClick={()=>set("houseType","detached")} />
              <OptionBtn label="🏢 マンション等" desc="区分所有・持ち家" selected={answers.houseType==="condo"} onClick={()=>set("houseType","condo")} />
            </div>
            {answers.houseType==="condo" && (
              <div style={{ marginTop:"14px", padding:"12px 16px", background:C.warnBg, border:`1.5px solid ${C.warnBorder}`, borderRadius:"12px", fontSize:"14px", color:C.warn, lineHeight:1.6 }}>
                ⚠️ マンションは管理組合の承認が必要な場合があります。
              </div>
            )}
            <NavRow onBack={back} onNext={next} nextDisabled={!answers.houseType} isFirst />
          </>}

          {step===2 && <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
              <OptionBtn label="🆕 新築" desc="これから建てる・建築中" selected={answers.condition==="new"} onClick={()=>set("condition","new")} />
              <OptionBtn label="🏡 既存住宅" desc="すでに建っている" selected={answers.condition==="existing"} onClick={()=>set("condition","existing")} />
            </div>
            <NavRow onBack={back} onNext={next} nextDisabled={!answers.condition} />
          </>}

          {step===3 && <>
            <div style={{ display:"grid", gap:"12px" }}>
              <OptionBtn label="☀️ 太陽光発電のみ" desc="売電・自家消費で毎月の電気代を削減" selected={answers.equipment==="solar"} onClick={()=>set("equipment","solar")} />
              <OptionBtn label="🔋 蓄電池のみ" desc="停電対策・夜間の自家消費に活用" selected={answers.equipment==="battery"} onClick={()=>set("equipment","battery")} />
              <OptionBtn label="☀️＋🔋 太陽光 ＋ 蓄電池" desc="補助金の組み合わせ効果が最大になる" selected={answers.equipment==="both"} onClick={()=>set("equipment","both")} />
            </div>
            <NavRow onBack={back} onNext={next} nextDisabled={!answers.equipment} />
          </>}

          {step===4 && <MuniStep answers={answers} set={set} onBack={back} onNext={next} />}

          {step===5 && <>
            {hasSolar && (
              <div style={{ marginBottom:"22px" }}>
                <div style={{ fontSize:"15px", fontWeight:700, color:"#444", marginBottom:"12px" }}>☀️ 太陽光発電の規模</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  {SOLAR_OPTIONS.map(o => <OptionBtn key={o.value} label={o.label} desc={o.desc} selected={answers.solarKw===o.value} onClick={()=>set("solarKw",o.value)} />)}
                </div>
              </div>
            )}
            {hasBattery && (
              <div>
                <div style={{ fontSize:"15px", fontWeight:700, color:"#444", marginBottom:"12px" }}>🔋 蓄電池の容量</div>
                <div style={{ display:"grid", gap:"10px" }}>
                  {BATTERY_OPTIONS.map(o => <OptionBtn key={o.value} label={o.label} desc={o.desc} selected={answers.batteryKwh===o.value} onClick={()=>set("batteryKwh",o.value)} />)}
                </div>
              </div>
            )}
            <NavRow onBack={back} onNext={()=>setStep(6)}
              nextDisabled={(hasSolar&&!answers.solarKw)||(hasBattery&&!answers.batteryKwh)}
              nextLabel="結果を見る →" />
          </>}
        </Card>
      </div>
    </div>
  );
}
