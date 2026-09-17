// Browser battle engine extracted from the original server implementation.
window.BattleEngine = (() => {
  const battleData = { content: [] };
const TYPE_CHART = {
  ノーマル:{いわ:0.5,ゴースト:0,はがね:0.5},
  ほのお:{くさ:2,こおり:2,むし:2,はがね:2,ほのお:0.5,みず:0.5,いわ:0.5,ドラゴン:0.5},
  みず:{ほのお:2,じめん:2,いわ:2,みず:0.5,くさ:0.5,ドラゴン:0.5},
  でんき:{みず:2,ひこう:2,じめん:0,でんき:0.5,くさ:0.5,ドラゴン:0.5},
  くさ:{みず:2,じめん:2,いわ:2,ほのお:0.5,くさ:0.5,どく:0.5,ひこう:0.5,むし:0.5,ドラゴン:0.5,はがね:0.5},
  こおり:{くさ:2,じめん:2,ひこう:2,ドラゴン:2,ほのお:0.5,みず:0.5,こおり:0.5,はがね:0.5},
  かくとう:{ノーマル:2,こおり:2,いわ:2,あく:2,はがね:2,どく:0.5,ひこう:0.5,エスパー:0.5,むし:0.5,フェアリー:0.5,ゴースト:0},
  どく:{くさ:2,フェアリー:2,どく:0.5,じめん:0.5,いわ:0.5,ゴースト:0.5,はがね:0},
  じめん:{ほのお:2,でんき:2,どく:2,いわ:2,はがね:2,くさ:0.5,むし:0.5,ひこう:0},
  ひこう:{くさ:2,かくとう:2,むし:2,でんき:0.5,いわ:0.5,はがね:0.5},
  エスパー:{かくとう:2,どく:2,エスパー:0.5,はがね:0.5,あく:0},
  むし:{くさ:2,エスパー:2,あく:2,ほのお:0.5,かくとう:0.5,どく:0.5,ひこう:0.5,ゴースト:0.5,はがね:0.5,フェアリー:0.5},
  いわ:{ほのお:2,こおり:2,ひこう:2,むし:2,かくとう:0.5,じめん:0.5,はがね:0.5},
  ゴースト:{エスパー:2,ゴースト:2,あく:0.5,ノーマル:0},
  ドラゴン:{ドラゴン:2,はがね:0.5,フェアリー:0},
  あく:{エスパー:2,ゴースト:2,かくとう:0.5,あく:0.5,フェアリー:0.5},
  はがね:{こおり:2,いわ:2,フェアリー:2,ほのお:0.5,みず:0.5,でんき:0.5,はがね:0.5},
  フェアリー:{かくとう:2,ドラゴン:2,あく:2,ほのお:0.5,どく:0.5,はがね:0.5}
};
const STATUS_NAMES = { burn:"やけど", paralysis:"まひ", poison:"どく", toxic:"もうどく", sleep:"ねむり", freeze:"こおり" };
const ALL_TYPES = ["ノーマル","ほのお","みず","でんき","くさ","こおり","かくとう","どく","じめん","ひこう","エスパー","むし","いわ","ゴースト","ドラゴン","あく","はがね","フェアリー"];
const STAT_NAMES = {attack:"攻撃",defense:"防御",spAttack:"特攻",spDefense:"特防",speed:"素早さ"};
const DEFAULT_STATS = {hp:100, attack:70, defense:70, spAttack:70, spDefense:70, speed:70};
const WEATHER_NAMES = {sun:"はれ", rain:"あめ", sand:"すなあらし", snow:"ゆき"};
const FIELD_NAMES = {electric:"エレキフィールド", grassy:"グラスフィールド", misty:"ミストフィールド", psychic:"サイコフィールド"};
const WALL_NAMES = {light_screen:"ひかりのかべ", reflect:"リフレクター", aurora_veil:"オーロラベール"};

function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function readKind(kind){return battleData.content.filter(r=>r.kind===kind).sort((a,b)=>a.id-b.id).map(r=>({id:r.id,kind:r.kind,data:r.data}));}
function getSpeciesByIds(ids){
  const rows=readKind("species");
  return ids.map(id=>rows.find(x=>String(x.data.id)===String(id))?.data).filter(Boolean);
}
function getSpeciesById(id){
  const rows=readKind("species");
  return rows.find(x=>String(x.data.id)===String(id))?.data || null;
}
function getMove(id){return readKind("move").find(x=>String(x.data.id)===String(id))?.data||null;}
function getAbility(id){return readKind("ability").find(x=>String(x.data.id)===String(id))?.data||null;}
function getItem(id){return readKind("item").find(x=>String(x.data.id)===String(id))?.data||null;}
function getEnemyTeam(){
  return readKind("enemy_team").map(x=>x.data).find(t=>Array.isArray(t.species)&&t.species.length>=3)||null;
}
function statValue(p,key){
  const base=Number((p.stats||{})[key] ?? DEFAULT_STATS[key]);
  const ev=Math.max(0,Math.min(32,Number((p.evs||{})[key] ?? 0)));
  const raw=base+20+ev;
  if(key==="hp") return base+ev+75;
  const nature=p.personality&&typeof p.personality==="object"?p.personality:{};
  if(nature.up===key) return Math.floor(raw*1.1);
  if(nature.down===key) return Math.floor(raw*0.9);
  return raw;
}
function personalityLabel(p){
  const n=p.personality&&typeof p.personality==="object"?p.personality:{};
  return {up:n.up||null,down:n.down||null};
}
function calculatedStats(p){
  return {hp:statValue(p,"hp"),attack:statValue(p,"attack"),defense:statValue(p,"defense"),spAttack:statValue(p,"spAttack"),spDefense:statValue(p,"spDefense"),speed:statValue(p,"speed")};
}
function speciesTypes(p){return Array.isArray(p.type)?p.type:(p.types||[]);}
function abilityIds(p){return (p.abilities||[]).map(String);}
function itemId(p){return p.itemId || p.item || null;}
function hasAbility(p,name){return abilityIds(p).includes(name) || p.ability===name;}
function effectTypesMatch(data,moveType){const types=Array.isArray(data?.effectTypes)?data.effectTypes.filter(Boolean):[];return types.length===0 || types.includes(moveType);}
function abilityEffects(ab){return [...new Set((Array.isArray(ab?.effects)&&ab.effects.length?ab.effects:[ab?.effect]).filter(Boolean))];}
function abilityDataList(p){return (Array.isArray(p?.abilities)?p.abilities:[]).map(x=>typeof x==="object"&&x?x:getAbility(x)).filter(Boolean);}
function abilityHasEffect(p,effect){return abilityDataList(p).some(ab=>abilityEffects(ab).includes(effect));}
function effectiveMoveType(attacker,move){
  let type=move.type||"ノーマル";
  for(const aid of abilityIds(attacker)){
    const ab=getAbility(aid);
    if(abilityEffects(ab).includes("change_move_type") && effectTypesMatch(ab,type) && ALL_TYPES.includes(ab.effectMoveType)){
      type=ab.effectMoveType;
    }
  }
  return type;
}
function hasFullHpSurvival(p,moveType){
  const item=itemWorks(p,moveType);
  if(item?.effect==="full_hp_survive") return true;
  return abilityIds(p).some(aid=>{const ab=getAbility(aid);return abilityEffects(ab).includes("full_hp_survive") && effectTypesMatch(ab,moveType);});
}
function abilityWorks(p,name,moveType){if(!hasAbility(p,name))return false;const id=abilityIds(p).find(x=>String(x)===String(name)) || (p.ability===name?name:null);return effectTypesMatch(getAbility(id),moveType);}
function itemWorks(p,moveType){const id=itemId(p);if(!id)return null;const item=getItem(id);if(!item)return null;return effectTypesMatch(item,moveType)?item:null;}
function isMegaStone(item){return !!item && (item.effect==='mega_stone' || (Array.isArray(item.effects)&&item.effects.includes('mega_stone'))); }
function effectRoll(move){return Math.random()*100 < clamp(Number(move.effectChance ?? 100),0,100);}
function moveEffectsOf(move){const a=Array.isArray(move?.effects)&&move.effects.length?move.effects:[move?.effect];return [...new Set(a.filter(Boolean))];}
function moveHasEffect(move,e){return moveEffectsOf(move).includes(e);}
function abilityHasEffect(p,e){return abilityIds(p).some(aid=>abilityEffects(getAbility(aid)).includes(e));}
function abilityHasEffectForMove(p,e,moveType){return abilityIds(p).some(aid=>{const ab=getAbility(aid);return abilityEffects(ab).includes(e) && effectTypesMatch(ab,moveType);});}
function abilityTypeImmune(p,moveType){return abilityIds(p).some(aid=>{const ab=getAbility(aid);const effects=abilityEffects(ab);const immune=Array.isArray(ab?.immuneTypes)?ab.immuneTypes:[];return effects.includes("type_immune") && immune.includes(moveType);});}
function canStatDrop(b,targetSide,targetIndex,sourceSide){
  if(!sourceSide || sourceSide===targetSide) return true;
  const target=targetSide.team[targetIndex];
  if(!target) return true;
  if(abilityHasEffect(target,"no_stat_drop")){ b.log.push(`${targetSide===b.player?"自分":"相手"}の${target.name}は特性で能力を下げられない！`); return false; }
  return true;
}
function moveIgnoresType(move){return moveHasEffect(move,"confusion_attack");}
function moveTypeMultiplier(b,attSide,defSide,move){
  const a=attSide.team[attSide.active], d=defSide.team[defSide.active];
  if(moveIgnoresType(move)) return 1;
  const moveType=effectiveMoveType(a,move);
  let mult=typeEffectiveness(moveType,d);
  if(Array.isArray(move.ineffectiveTypes) && move.ineffectiveTypes.some(t=>speciesTypes(d).includes(t))) mult=0;
  if(abilityTypeImmune(d,moveType)) mult=0;
  return mult;
}
function moveIsTypeInvalid(b,attSide,defSide,move){
  if((move.target||"opponent")!=="opponent" || Number(move.power||0)<=0) return false;
  return moveTypeMultiplier(b,attSide,defSide,move)===0;
}
function effectiveSpeed(side,p){
  let v=statValue(p,"speed");
  const status=side.status[side.active] || null;
  if(status==="paralysis")v=Math.floor(v/2);
  if(hasAbility(p,"swift_swim") && side.weather==="rain")v*=2;
  if(hasAbility(p,"chlorophyll") && side.weather==="sun")v*=2;
  if(hasAbility(p,"slow_start") && side.slowStart[side.active])v=Math.floor(v/2);
  const item=getItem(itemId(p));
  if(item?.effect==="choice_scarf")v=Math.floor(v*1.5);
  if((item?.effect==="choice_1_5_lock" && (Array.isArray(item.choiceStats)?item.choiceStats:["attack","defense","spAttack","spDefense","speed"]).includes("speed")) || item?.effect==="choice_speed_1_5")v=Math.floor(v*1.5);
  if(side.itemLost[side.active])v*=2;
  return v;
}
function typeEffectiveness(moveType,target){
  let mult=1;
  for(const t of speciesTypes(target)) mult*=TYPE_CHART[moveType]?.[t] ?? 1;
  return mult;
}
function initSide(team,selected){
  if(!Array.isArray(team)||!team.length)throw new Error("パーティが空です。");
  if(!Array.isArray(selected)||selected.some(i=>!Number.isInteger(i)||i<0||i>=team.length))throw new Error("選出ポケモンの番号が不正です。");
  return {team,selected,active:selected.length?selected[0]:null,hp:team.map(p=>statValue(p,"hp")),maxHp:team.map(p=>statValue(p,"hp")),
    status:team.map(()=>null),statusTurns:team.map(()=>0),boosts:team.map(()=>({attack:0,defense:0,spAttack:0,spDefense:0,speed:0})),
    protected:team.map(()=>false),hazards:{stealth_rock:false,spikes:0},slowStart:team.map(p=>hasAbility(p||{},"slow_start")),weather:null,weatherTurns:0,field:null,fieldTurns:0,walls:{light_screen:0,reflect:0,aurora_veil:0},
    volatile:team.map(()=>({})),disguiseBroken:team.map(()=>false),choiceMove:team.map(()=>null),itemLost:team.map(()=>false),itemTriggered:team.map(()=>false),megaUsed:false};
}
function normalizeSide(side){
  if(!side || !Array.isArray(side.team)) return;
  const n=side.team.length;
  // 古いlocalStorageや途中バージョンの状態でも、ターン開始時に必要な配列を必ず再構築する。
  const validTeam=[];
  for(let i=0;i<n;i++) validTeam.push(side.team[i] && typeof side.team[i]==="object" ? side.team[i] : {id:`unknown-${i}`,name:"不明なポケモン",type:["ノーマル"],moves:[]});
  side.team=validTeam;
  // 途中バージョンや不完全な保存データから復帰できるよう、ポケモン本体の必須プロパティも補完する。
  for(const p of side.team){
    if(!Array.isArray(p.type)) p.type=["ノーマル"];
    if(!Array.isArray(p.moves)) p.moves=[];
    if(!Array.isArray(p.abilities)) p.abilities=[];
    if(!p.stats || typeof p.stats!=="object") p.stats={hp:1,attack:1,defense:1,spAttack:1,spDefense:1,speed:1};
    if(!p.evs || typeof p.evs!=="object") p.evs={hp:0,attack:0,defense:0,spAttack:0,spDefense:0,speed:0};
    if(!p.personality || typeof p.personality!=="object") p.personality={};
    if(!p.mega || typeof p.mega!=="object") p.mega={enabled:false};
  }
  if(!Array.isArray(side.selected)) side.selected=[];
  side.selected=side.selected.map(Number).filter(i=>Number.isInteger(i)&&i>=0&&i<n);
  side.selected=[...new Set(side.selected)];
  if(!Number.isInteger(side.active)||side.active<0||side.active>=n || (side.selected.length && !side.selected.includes(side.active))) side.active=side.selected.length?side.selected[0]:null;
  const fill=(key,fallback)=>{
    if(!Array.isArray(side[key])) side[key]=[];
    while(side[key].length<n) side[key].push(fallback());
    if(side[key].length>n) side[key]=side[key].slice(0,n);
    for(let i=0;i<n;i++) if(side[key][i]===undefined || side[key][i]===null) side[key][i]=fallback();
  };
  fill('status',()=>null); fill('statusTurns',()=>0); fill('hp',()=>0); fill('maxHp',()=>0);
  fill('boosts',()=>({attack:0,defense:0,spAttack:0,spDefense:0,speed:0}));
  fill('protected',()=>false); fill('volatile',()=>({})); fill('disguiseBroken',()=>false); fill('choiceMove',()=>null); fill('itemLost',()=>false); fill('itemTriggered',()=>false);
  fill('slowStart',()=>false); fill('logFainted',()=>false);
  side.boosts=side.boosts.map(x=>({attack:0,defense:0,spAttack:0,spDefense:0,speed:0,...(x&&typeof x==='object'?x:{})}));
  side.volatile=side.volatile.map(x=>x&&typeof x==='object'?x:{});
  side.hazards={stealth_rock:false,spikes:0,...(side.hazards||{})};
  side.walls={light_screen:0,reflect:0,aurora_veil:0,...(side.walls||{})};
  if(side.weather===undefined)side.weather=null; if(side.weatherTurns===undefined)side.weatherTurns=0;
  if(side.field===undefined)side.field=null; if(side.fieldTurns===undefined)side.fieldTurns=0;
  if(side.megaUsed===undefined)side.megaUsed=false;
  if(side.megaThisTurn===undefined)side.megaThisTurn=false;
  for(let i=0;i<n;i++){
    if(!Number.isFinite(Number(side.maxHp[i]))||Number(side.maxHp[i])<=0) side.maxHp[i]=statValue(side.team[i],"hp");
    if(!Number.isFinite(Number(side.hp[i]))||Number(side.hp[i])<0) side.hp[i]=side.maxHp[i];
    side.statusTurns[i]=Math.max(0,Number(side.statusTurns[i])||0);
    side.boosts[i]={attack:0,defense:0,spAttack:0,spDefense:0,speed:0,...(side.boosts[i]||{})};
  }
}
function normalizeBattleState(b){
  if(!b||!b.player||!b.enemy) return b;
  normalizeSide(b.player); normalizeSide(b.enemy);
  if(!Array.isArray(b.log))b.log=[];
  if(!Number.isFinite(Number(b.turn))||b.turn<1)b.turn=1;
  if(!b.phase)b.phase="selection";
  if(b.over===undefined)b.over=false;
  if(b.pendingEnemyMoveId===undefined)b.pendingEnemyMoveId=null;
  if(b.pendingPlayerMoveId===undefined)b.pendingPlayerMoveId=null;
  if(b.pendingEnemyAction===undefined)b.pendingEnemyAction=null;
  return b;
}
function publicPokemon(side,i,reveal=true){
  const p=side.team[i];
  if(!p) return {name:"？？？",hp:0,maxHp:0,selected:false,active:false,fainted:false,status:null,type:[],item:null,abilities:[],moves:[],stats:{},personality:{},mega:false,megaAvailable:false,choiceMove:null,itemLost:false};
  const st=side.status[i];
  return {name:reveal?p.name:"？？？",hp:reveal?side.hp[i]:null,maxHp:reveal?side.maxHp[i]:null,selected:reveal?side.selected.includes(i):false,active:i===side.active,
    fainted:reveal?side.hp[i]<=0:false,status:reveal?([st?STATUS_NAMES[st]:null, side.volatile[i]?.confusionTurns>0?"こんらん":null].filter(Boolean).join("・")||null):null,type:reveal?speciesTypes(p):[],item:reveal&&itemId(p)?getItem(itemId(p))?.name:null,
    abilities:reveal?abilityIds(p):[],moves:reveal&&Array.isArray(p.moves)?p.moves.map(String).filter(id=>getMove(id)):[],stats:reveal?calculatedStats(p):{},personality:reveal?personalityLabel(p):{},mega:reveal?!!p._mega:false,megaAvailable:reveal?!!p.mega?.enabled&&!side.megaUsed:false,choiceMove:reveal&&side.choiceMove[i]?String(side.choiceMove[i]):null,itemLost:reveal?!!side.itemLost[i]:false};
}
function publicBattle(b){
  // CPUの6匹や選出番号は公開しない。プレイヤーには現在場にいるCPUだけを見せる。
  const enemyTeam=b.enemy.team.map((_,i)=>publicPokemon(b.enemy,i,i===b.enemy.active));
  return {id:b.id,turn:b.turn,phase:b.phase,over:b.over,result:b.result,
    weather:b.weather||null,weatherTurns:b.weatherTurns||0,field:b.field||null,fieldTurns:b.fieldTurns||0,playerWalls:b.player.walls,enemyWalls:b.enemy.walls,playerHazards:b.player.hazards,enemyHazards:b.enemy.hazards,
    player:{team:b.player.team.map((_,i)=>publicPokemon(b.player,i,true)),active:b.player.active},
    enemy:{team:enemyTeam,active:b.enemy.active},
    log:b.log.slice(-100)};
}
function makeBattle(playerIds){
  if(!Array.isArray(playerIds)||playerIds.length!==6)throw new Error("6匹の登録済みポケモンが必要です。");
  const playerTeam=playerIds.map(id=>getSpeciesById(id));
  if(playerTeam.some(p=>!p))throw new Error("選択した6匹のポケモン情報を正しく取得できませんでした。");
  const enemyData=getEnemyTeam(); if(!enemyData)throw new Error("開発者が相手パーティを登録していません。");
  if(!Array.isArray(enemyData.species)||enemyData.species.length<3)throw new Error("相手パーティは3匹以上必要です。");
  const enemyTeam=enemyData.species.slice(0,6).map(id=>getSpeciesById(id));
  if(enemyTeam.some(p=>!p))throw new Error("相手パーティに未登録のポケモンがあります。相手パーティを登録し直してください。");
  let enemySelected=Array.isArray(enemyData.selected)?enemyData.selected.map(Number).filter(Number.isInteger):[0,1,2];
  enemySelected=[...new Set(enemySelected)].filter(i=>i>=0&&i<enemyTeam.length).slice(0,3);
  while(enemySelected.length<3){const next=enemyTeam.findIndex((_,i)=>!enemySelected.includes(i));if(next<0)break;enemySelected.push(next);}
  if(enemySelected.length!==3)throw new Error("相手パーティの選出が不正です。相手パーティを登録し直してください。");
  const b={id:crypto.randomUUID(),turn:1,phase:"selection",over:false,result:null,weather:null,pendingEnemyMoveId:null,cpuBattle:true,
    player:initSide(playerTeam,[]),enemy:initSide(enemyTeam,enemySelected),log:["対戦開始。自分の6匹から3匹を選出してください。"]};
  return b;
}
function boostMultiplier(stage){return stage>=0?(2+stage)/2:2/(2-stage);}
function statWithBoost(side,i,key){
  const p=side.team[i];
  if(!p) return 1;
  if(!side.boosts[i] || typeof side.boosts[i]!=="object") side.boosts[i]={attack:0,defense:0,spAttack:0,spDefense:0,speed:0};
  const choice=getItem(itemId(p));
  const choiceStats=choice?.effect==="choice_1_5_lock" ? (Array.isArray(choice.choiceStats)?choice.choiceStats:["attack","defense","spAttack","spDefense","speed"]) : (choice?.effect==="choice_attack_1_5"?["attack"]:choice?.effect==="choice_spAttack_1_5"?["spAttack"]:choice?.effect==="choice_speed_1_5"?["speed"]:[]);
  const base=statValue(p,key)*(choiceStats.includes(key)?1.5:1);
  return Math.max(1,Math.floor(base*boostMultiplier(side.boosts[i][key]||0)));
}
function addBoost(b,side,i,key,amount,sourceSide=null){
  if(amount<0 && !canStatDrop(b,side,i,sourceSide)) return false;
  if(!side.boosts[i] || typeof side.boosts[i]!=="object") side.boosts[i]={attack:0,defense:0,spAttack:0,spDefense:0,speed:0};
  if(!Object.prototype.hasOwnProperty.call(side.boosts[i],key)) side.boosts[i][key]=0;
  side.boosts[i][key]=clamp((side.boosts[i][key]||0)+amount,-6,6);
  const n=side.boosts[i][key];
  b.log.push(`${side===b.player?"自分":"相手"}の${side.team[i].name}の${key}が${amount>0?"上がった":"下がった"}（ランク${n}）。`);
}
function effectStatKeys(data){ const xs=Array.isArray(data?.effectStats)&&data.effectStats.length?data.effectStats:[data?.effectStat]; return xs.filter(k=>STAT_NAMES[k]); }
function setStatus(b,side,i,status,fromStatusMove=false){
  if(side.status[i]||side.hp[i]<=0)return false;
  const p=side.team[i];
  if(fromStatusMove && hasAbility(p,"status_immune")) { b.log.push(`${p.name}は相手の変化技を受けない！`); return false; }
  if(status==="burn" && abilityHasEffect(p,"no_burn")){b.log.push(`${p.name}の特性でやけどにならない！`);return false;}
  if(status==="paralysis" && abilityHasEffect(p,"no_paralysis")){b.log.push(`${p.name}の特性でまひにならない！`);return false;}
  if(status==="poison" && speciesTypes(side.team[i]).includes("どく"))return false;
  if(status==="toxic" && (speciesTypes(side.team[i]).includes("どく")||speciesTypes(side.team[i]).includes("はがね")))return false;
  if(status==="paralysis" && speciesTypes(side.team[i]).includes("でんき"))return false;
  side.status[i]=status;side.statusTurns[i]=0;
  b.log.push(`${side===b.player?"自分":"相手"}の${side.team[i].name}は${STATUS_NAMES[status]}になった！`);
  return true;
}
function setConfusion(b,side,i){
  if(side.hp[i]<=0) return false;
  const p=side.team[i];
  if(side.volatile[i]?.confusionTurns>0){b.log.push(`${side===b.player?"自分":"相手"}の${p.name}はすでにこんらんしている！`);return false;}
  side.volatile[i].confusionTurns=2+Math.floor(Math.random()*3);
  b.log.push(`${side===b.player?"自分":"相手"}の${p.name}はこんらんした！`);
  return true;
}
function confusionHit(b,side,i){
  const p=side.team[i];
  const atk=statWithBoost(side,i,"attack"), def=statWithBoost(side,i,"defense");
  const base=Math.floor(Math.floor((2*50/5+2)*40*atk/Math.max(1,def))/50)+2;
  const damage=Math.max(1,Math.floor(base*(0.85+Math.random()*0.15)));
  side.hp[i]=Math.max(0,side.hp[i]-damage);
  b.log.push(`${side===b.player?"自分":"相手"}の${p.name}はこんらんして自分を攻撃し、${damage}ダメージ。`);
  return damage;
}
function canAct(b,side,i){
  const st=side.status[i];
  if(st==="sleep"){side.statusTurns[i]++; if(side.statusTurns[i]>=2){side.status[i]=null;b.log.push(`${side.team[i].name}は目を覚ました！`);return true} b.log.push(`${side.team[i].name}は眠っていて動けない！`);return false;}
  if(st==="freeze"){if(Math.random()<0.2){side.status[i]=null;b.log.push(`${side.team[i].name}のこおりがとけた！`);return true}b.log.push(`${side.team[i].name}はこおって動けない！`);return false;}
  if(st==="paralysis"&&Math.random()<0.25){b.log.push(`${side.team[i].name}はまひして動けない！`);return false;}
  return true;
}
function endTurnSide(b,side){
  const i=side.active,p=side.team[i],st=side.status[i];
  if(side.hp[i]<=0)return;
  if(side.volatile[i]?.enteredThisTurn){ delete side.volatile[i].enteredThisTurn; } else if(abilityHasEffect(p,"end_turn_speed_up")){ addBoost(b,side,i,"speed",1); b.log.push(`${p.name}の特性で素早さが1段階上がった！`); }
  if(st==="burn"){const d=Math.max(1,Math.floor(side.maxHp[i]/16));side.hp[i]=Math.max(0,side.hp[i]-d);b.log.push(`${side===b.player?"自分":"相手"}の${p.name}はやけどで${d}ダメージ。`);}
  if(st==="poison"){const d=Math.max(1,Math.floor(side.maxHp[i]/8));side.hp[i]=Math.max(0,side.hp[i]-d);b.log.push(`${side===b.player?"自分":"相手"}の${p.name}はどくで${d}ダメージ。`);}
  if(side.hp[i]>0) triggerHalfHpHeal(b,side,i);
  if(st==="toxic"){side.statusTurns[i]++;const d=Math.max(1,Math.floor(side.maxHp[i]*side.statusTurns[i]/16));side.hp[i]=Math.max(0,side.hp[i]-d);b.log.push(`${side===b.player?"自分":"相手"}の${p.name}はもうどくで${d}ダメージ。`);}
  const item=getItem(itemId(p));
  if(item?.effect==="leftovers"&&side.hp[i]>0){const heal=Math.max(1,Math.floor(side.maxHp[i]/16));side.hp[i]=Math.min(side.maxHp[i],side.hp[i]+heal);b.log.push(`${side===b.player?"自分":"相手"}の${p.name}はたべのこしで${heal}回復。`);}
  if(b.field==="grassy"&&side.hp[i]>0){const heal=Math.max(1,Math.floor(side.maxHp[i]/16));side.hp[i]=Math.min(side.maxHp[i],side.hp[i]+heal);b.log.push(`${side===b.player?"自分":"相手"}の${p.name}はグラスフィールドで${heal}回復。`);}
}
function applyHazards(b,side,i){
  const p=side.team[i];
  const h=side===b.player?b.enemy.hazards:b.player.hazards;
  if(h.stealth_rock) {
    const mult=typeEffectiveness("いわ",p);
    const d=Math.max(1,Math.floor(side.maxHp[i]/8*mult));
    side.hp[i]=Math.max(0,side.hp[i]-d);
    b.log.push(`${side===b.player?"自分":"相手"}の${p.name}はステルスロックで${d}ダメージを受けた！`);
  }
  if(h.spikes>0 && !speciesTypes(p).includes("ひこう")) {
    const ratio=h.spikes===1?1/8:h.spikes===2?1/6:1/4;
    const d=Math.max(1,Math.floor(side.maxHp[i]*ratio));
    side.hp[i]=Math.max(0,side.hp[i]-d);
    b.log.push(`${side===b.player?"自分":"相手"}の${p.name}はまきびしで${d}ダメージを受けた！`);
  }
}
function setHazard(b,side,effect){
  if(effect==="stealth_rock") {
    if(side.hazards.stealth_rock){b.log.push("ステルスロックはすでに撒かれている！");return;}
    side.hazards.stealth_rock=true; b.log.push(`${side===b.player?"自分":"相手"}のステルスロックを撒いた！`);
  } else if(effect==="spikes") {
    if(side.hazards.spikes>=3){b.log.push("まきびしはこれ以上撒けない！");return;}
    side.hazards.spikes++; b.log.push(`${side===b.player?"自分":"相手"}のまきびしを撒いた！（${side.hazards.spikes}段階）`);
  }
}
function applyEntryEffects(b,side,i){
  const p=side.team[i];
  const effects=[];
  for(const aid of abilityIds(p)){
    const ab=getAbility(aid);
    if(abilityEffects(ab).includes("stat_boost")||abilityEffects(ab).includes("stat_drop")) effects.push({source:"特性",data:ab});
  }
  const item=getItem(itemId(p));
  if(item?.effect==="stat_boost"||item?.effect==="stat_drop") effects.push({source:"持ち物",data:item});
  for(const {source,data} of effects){
    const amount=(data.effect==="stat_drop"?-1:1)*clamp(Number(data.effectStages||1),1,3);
    const target=data.effectTarget==="opponent"?(side===b.player?b.enemy:b.player):side;
    const ti=target.active;
    for(const key of effectStatKeys(data)) if(target.hp[ti]>0) addBoost(b,target,ti,key,amount,side);
    b.log.push(`${p.name}の${source}「${data.name||""}」の能力変化が発動した！`);
  }
  // 場に出た時の追加特性
  for(const aid of abilityIds(p)){
    const ab=getAbility(aid);
    if(!ab) continue;
    if(abilityEffects(ab).includes("entry_attack_drop")) {
      const other=side===b.player?b.enemy:b.player, oi=other.active;
      if(other.hp[oi]>0) addBoost(b,other,oi,"attack",-1,side);
      b.log.push(`${p.name}の特性「${ab.name||aid}」で相手の攻撃が下がった！`);
    }
  }
  applyHazards(b,side,i);

  // 特性による天候・フィールド展開は、その特性を持つポケモンが場に出た時に発動。
  for(const aid of abilityIds(p)){
    const ab=getAbility(aid);
    if(!ab) continue;
    if(abilityEffects(ab).includes("set_weather") && WEATHER_NAMES[ab.weather]){
      if(setWeather(b,ab.weather,Number(ab.weatherDuration||5),side)) b.log.push(`${p.name}の特性「${ab.name||aid}」で天候が変化した！`);
    }
    if(abilityEffects(ab).includes("set_field") && FIELD_NAMES[ab.field]){
      if(setField(b,ab.field,Number(ab.fieldDuration||5),side)) b.log.push(`${p.name}の特性「${ab.name||aid}」でフィールドが展開された！`);
    }
  }
}
function extendDuration(side,key,amount){side[key]=Math.max(0,Number(side[key]||0)+amount);}
function setWeather(b,weather,duration=5,sourceSide=null){
  if(!weather) return false;
  if(b.weather===weather){ b.log.push(`天候はすでに${WEATHER_NAMES[weather]||weather}です。`); return false; }
  let d=duration;
  if(sourceSide){const item=getItem(itemId(sourceSide.team[sourceSide.active]));if(item?.effect==="weather_extend"&&item.effectWeather===weather)d+=5;}
  b.weather=weather;b.weatherTurns=d;b.log.push(`天候が${WEATHER_NAMES[weather]||weather}になった！（${d}ターン）`); return true;
}
function setField(b,field,duration=5,sourceSide=null){
  if(!field) return false;
  if(b.field===field){ b.log.push(`フィールドはすでに${FIELD_NAMES[field]||field}です。`); return false; }
  let d=duration;
  if(sourceSide){const item=getItem(itemId(sourceSide.team[sourceSide.active]));if(item?.effect==="field_extend"&&item.effectField===field)d+=5;}
  b.field=field;b.fieldTurns=d;b.log.push(`フィールドが${FIELD_NAMES[field]||field}になった！（${d}ターン）`);
  applyFieldSeedsAll(b); return true;
}
function setWall(b,side,wall,duration=5){let d=duration;const item=getItem(itemId(side.team[side.active]));if(item?.effect==="wall_extend" && item.effectWall===wall)d+=5;side.walls[wall]=Math.max(side.walls[wall]||0,d);b.log.push(`${WALL_NAMES[wall]||wall}を張った！（${side.walls[wall]}ターン）`);}
function consumeItem(side,i,b,reason){const p=side.team[i],item=getItem(itemId(p));if(!item||item.consume===false||isMegaStone(item))return false;const id=itemId(p);p.itemId=null;p.item=null;side.itemLost[i]=true;b.log.push(`${p.name}の${item.name||id}は${reason}で消費された！`);if(getAbility(p,"speed_2x_item_lost"))b.log.push(`${p.name}は持ち物を失い、素早さが2倍になった！`);return true;}
function applyFieldSeed(b,side,i){const p=side.team[i],item=getItem(itemId(p));if(!item||item.effect!=="field_seed"||b.field!==item.seedField)return;addBoost(b,side,i,item.effectStat,clamp(Number(item.effectStages||1),1,3));b.log.push(`${p.name}の${item.name||"フィールドシード"}が発動した！`);if(item.consume!==false)consumeItem(side,i,b,"フィールド条件");}
function applyFieldSeedsAll(b){for(const side of [b.player,b.enemy]){const i=side.active;if(side.hp[i]>0)applyFieldSeed(b,side,i);}}
function triggerHalfHpHeal(b,side,i){
  if(side.hp[i]<=0 || side.itemTriggered[i]) return;
  const p=side.team[i], item=getItem(itemId(p));
  if(!item || item.effect!=="half_hp_heal_quarter") return;
  if(side.hp[i]>side.maxHp[i]/2) return;
  const heal=Math.max(1,Math.floor(side.maxHp[i]/4));
  const before=side.hp[i];
  side.hp[i]=Math.min(side.maxHp[i],side.hp[i]+heal);
  side.itemTriggered[i]=true;
  b.log.push(`${p.name}の${item.name||"持ち物"}が発動し、HPを${side.hp[i]-before}回復した！`);
  if(item.consume!==false) consumeItem(side,i,b,"HP半分以下になった時の回復");
}
function applySwitchIn(b,side){
  const i=side.active,p=side.team[i];
  side.choiceMove[i]=null;
  side.itemLost[i]=false;
  side.itemTriggered[i]=false;
  side.volatile[i]={enteredThisTurn:true};
  applyEntryEffects(b,side,i);
  if(hasAbility(p,"intimidate")){
    const other=side===b.player?b.enemy:b.player, oi=other.active;
    if(other.hp[oi]>0){
      if(abilityHasEffect(other.team[oi],"no_intimidate")){
        b.log.push(`${other.team[oi].name}の特性でいかくの効果を受けない！`);
      }else{
        addBoost(b,other,oi,"attack",-1);
        b.log.push(`${p.name}のいかく！`);
      }
    }
  }
  if(hasAbility(p,"drizzle")){setWeather(b,"rain",5,side);}
  if(hasAbility(p,"drought")){setWeather(b,"sun",5,side);}
  applyFieldSeed(b,side,i);
  // CPU戦では、メガシンカ可能なポケモンを場に出した時点で自動的にメガシンカする。
  // オンライン対戦などのユーザー同士の戦闘では自動発動させない。
  if(b.cpuBattle && side===b.enemy && !side.megaUsed && p.mega?.enabled && isMegaStone(getItem(itemId(p)))){
    megaEvolve(b,side);
  }
}
function sideStageForCrit(side,i,key,isCrit,attacker){
  const st=Number(side.boosts?.[i]?.[key]||0);
  if(!isCrit) return st;
  return attacker?Math.max(0,st):Math.min(0,st);
}
function statWithExplicitStage(side,i,key,stage){
  const p=side.team[i]; if(!p) return 1;
  const choice=getItem(itemId(p));
  const choiceStats=choice?.effect==="choice_1_5_lock"?(Array.isArray(choice.choiceStats)?choice.choiceStats:["attack","defense","spAttack","spDefense","speed"]):(choice?.effect==="choice_attack_1_5"?["attack"]:choice?.effect==="choice_spAttack_1_5"?["spAttack"]:choice?.effect==="choice_speed_1_5"?["speed"]:[]);
  return Math.max(1,Math.floor(statValue(p,key)*(choiceStats.includes(key)?1.5:1)*boostMultiplier(stage)));
}
function calcDamage(b,attSide,defSide,move){
  const ai=attSide.active,di=defSide.active,a=attSide.team[ai],d=defSide.team[di];
  const moveType=effectiveMoveType(a,move);
  const category=move.category||"physical";
  const atkKey=category==="special"?"spAttack":"attack";
  const defKey=category==="special"?"spDefense":"defense";
  const stage=clamp(Number(move.criticalStage||0),0,3);
  const isCrit=stage>0?Math.random() < ([1/24,1/8,1/2,1][stage]||1):Math.random()<1/24;
  const atkStage=sideStageForCrit(attSide,ai,atkKey,isCrit,true);
  const defStage=sideStageForCrit(defSide,di,defKey,isCrit,false);
  const atk=statWithExplicitStage(attSide,ai,atkKey,atkStage);
  const def=statWithExplicitStage(defSide,di,defKey,defStage);
  let base=Math.floor(Math.floor((2*50/5+2)*Number(move.power||0)*atk/Math.max(1,def))/50)+2;
  // やけど中は物理技のダメージを半減する
  if(category==="physical" && attSide.status[ai]==="burn") base=Math.floor(base/2);
  if(move.contact && abilityHasEffectForMove(d,"contact_damage_half",moveType)){ base=Math.floor(base/2); b.log.push(`${d.name}の特性で接触技の威力が半減した！`); }
  if(attSide.hp[ai]===attSide.maxHp[ai] && abilityHasEffect(d,"full_hp_damage_half")) base=Math.floor(base/2);
  let mult=moveIgnoresType(move)?1:moveTypeMultiplier(b,attSide,defSide,move);
  if(mult===0)return {damage:0,mult,stab:1};
  const stab=speciesTypes(a).includes(moveType)?1.5:1;
  const weather=(b.weather==="rain"&&moveType==="みず")?1.5:(b.weather==="rain"&&moveType==="ほのお")?.5:(b.weather==="sun"&&moveType==="ほのお")?1.5:(b.weather==="sun"&&moveType==="みず")?.5:(b.weather==="sand"&&["いわ","じめん","はがね"].includes(moveType))?1.1:(b.weather==="snow"&&moveType==="こおり")?1.5:1;
  let terrain=(b.field==="electric"&&moveType==="でんき")?1.3:(b.field==="grassy"&&moveType==="くさ")?1.3:(b.field==="psychic"&&moveType==="エスパー")?1.3:(b.field==="misty"&&moveType==="ドラゴン")?.5:1;
  if(b.field==="grassy" && moveHasEffect(move,"grassy_power_half")) terrain*=0.5;
  let itemMult=1;const item=itemWorks(a,moveType);
  if(move.contact && abilityHasEffect(a,"contact_power_1_3")) itemMult*=1.3;
  const defenderHeldItem = !!itemId(d);
  if(moveHasEffect(move,"item_power_1_5") && defenderHeldItem) itemMult*=1.5;
  if(item?.effect==="life_orb")itemMult*=1.3;
  if(item?.effect==="power_1_2")itemMult*=1.2;
  if(item?.effect==="power_1_3_recoil")itemMult*=1.3;
  for(const aid of abilityIds(a)){
    const ab=getAbility(aid); if(!ab || !effectTypesMatch(ab,move.type)) continue;
    if(abilityEffects(ab).includes("power_1_2")){itemMult*=1.2;b.log.push(`${a.name}の特性「${ab.name||aid}」で技の威力が1.2倍になった！`);} 
    if(abilityEffects(ab).includes("power_1_3_recoil")){itemMult*=1.3;b.log.push(`${a.name}の特性「${ab.name||aid}」で技の威力が1.3倍になった！`);} 
  }
  if(abilityWorks(a,"blaze",moveType)&&moveType==="ほのお"&&attSide.hp[ai]<=attSide.maxHp[ai]/3)mult*=1.5;
  if(abilityWorks(a,"torrent",moveType)&&moveType==="みず"&&attSide.hp[ai]<=attSide.maxHp[ai]/3)mult*=1.5;
  if(abilityWorks(a,"huge_power",moveType)&&category==="physical")base*=2;
  if(moveHasEffect(move,"faint_ally_power_plus_50")){const fainted=attSide.selected.filter(x=>x!==ai&&attSide.hp[x]<=0).length;if(fainted>0){base=Math.floor(base+50*fainted);b.log.push(`${a.name}は戦闘不能になった味方${fainted}匹分、技の威力が+${50*fainted}された！`);}}
  if(base < 0) base=0;
  for(const aid of abilityIds(a)){
    const ab=getAbility(aid);
    if(abilityEffects(ab).includes("power_1_5_under_60") && effectTypesMatch(ab,moveType) && Number(move.power||0)<60){itemMult*=1.5;b.log.push(`${a.name}の特性「${ab.name||aid}」で威力60未満の技が1.5倍になった！`);}
    if(abilityEffects(ab).includes("faint_ally_power_1_1")){
      const fainted=attSide.selected.filter(x=>x!==ai && attSide.hp[x]<=0).length;
      if(fainted>0){itemMult*=1+(0.1*fainted);b.log.push(`${a.name}の特性で瀕死の味方${fainted}匹分、技の威力が上がった！`);}
    }
  }
  const crit=isCrit?1.5:1;
  const random=0.85+Math.random()*0.15;
    let wall=1;
  if(!moveHasEffect(move,"wall_break")){
    if(category==="physical" && (defSide.walls.reflect>0 || defSide.walls.aurora_veil>0)) wall*=0.5;
    if(category==="special" && (defSide.walls.light_screen>0 || defSide.walls.aurora_veil>0)) wall*=0.5;
  }
  return {damage:Math.max(1,Math.floor(base*stab*mult*weather*terrain*itemMult*wall*crit*random)),mult,stab,crit,moveType,isCrit};
}
function triggerReceivedTypeStatBoost(b,attSide,defSide,move,di){
  const moveType=effectiveMoveType(attSide.team[attSide.active],move);
  const target=defSide.team[di];
  if(!target || defSide.hp[di]<=0) return;
  for(const aid of abilityIds(target)){
    const ab=getAbility(aid);
    if(!ab || !abilityEffects(ab).includes("received_type_stat_boost")) continue;
    if(ab.receivedMoveType !== moveType) continue;
    const stat=STAT_NAMES[ab.receivedStat] && ab.receivedStat !== "hp" ? ab.receivedStat : null;
    if(!stat) continue;
    const stages=clamp(Number(ab.receivedStages||1),1,3);
    addBoost(b,defSide,di,stat,stages);
    b.log.push(`${target.name}の特性「${ab.name||aid}」で${moveType}タイプの技を受け、${STAT_NAMES[stat]}が${stages}段階上がった！`);
  }
}
function doMove(b,attSide,defSide,move){
  const ai=attSide.active;
  const target=move.target||"opponent";
  const targetSide=target==="self"?attSide:(target==="field"?null:defSide);
  const di=targetSide?targetSide.active:null;
  const a=attSide.team[ai],d=targetSide?targetSide.team[di]:null;
  const effects=moveEffectsOf(move);
  // 「場に出た最初のターンじゃないと失敗する」効果。交代直後だけ使用でき、
  // ターン終了時に enteredThisTurn が消えるため、次のターン以降は必ず失敗する。
  if(effects.includes("first_turn_only") && !attSide.volatile[ai]?.enteredThisTurn){
    b.log.push(`${attSide===b.player?"自分":"相手"}の${a.name}の${move.name}は場に出た最初のターンではないため失敗した！`);
    return {switched:false};
  }
  if(b.field==="psychic" && Number(move.priority||0)>0 && target==="opponent"){b.log.push(`${attSide===b.player?"自分":"相手"}の${a.name}の${move.name}はサイコフィールドに阻まれた！`);return {switched:false};}
  if(!canAct(b,attSide,ai))return {switched:false};
  if(attSide.volatile[ai]?.confusionTurns>0){
    const turns=Number(attSide.volatile[ai].confusionTurns)||0;
    attSide.volatile[ai].confusionTurns=Math.max(0,turns-1);
    if(Math.random()<0.5){
      confusionHit(b,attSide,ai);
      if(attSide.volatile[ai].confusionTurns<=0) b.log.push(`${attSide===b.player?"自分":"相手"}の${a.name}のこんらんがとけた！`);
      return {switched:false};
    }
    b.log.push(`${attSide===b.player?"自分":"相手"}の${a.name}はこんらんしているが、なんとか技を出した！`);
    if(attSide.volatile[ai].confusionTurns<=0) b.log.push(`${attSide===b.player?"自分":"相手"}の${a.name}のこんらんがとけた！`);
  }
  const choice=getItem(itemId(a));
  if(["choice_1_5_lock","choice_attack_1_5","choice_spAttack_1_5","choice_speed_1_5"].includes(choice?.effect)) {
    if(attSide.choiceMove[ai] && String(attSide.choiceMove[ai])!==String(move.id)) throw new Error(`${a.name}はこだわり状態で${getMove(attSide.choiceMove[ai])?.name||"その技"}しか使えません。`);
    if(!attSide.choiceMove[ai]) { attSide.choiceMove[ai]=String(move.id); b.log.push(`${a.name}は${move.name}にこだわった！`); }
  }
  if(targetSide && move.category==="status" && hasAbility(d,"status_immune")){b.log.push(`${d.name}は相手の変化技を受けない！`);return {switched:false};}

  // 場に出てから最初に選んだ技のタイプを自分のタイプにする。
  if(abilityHasEffect(a,"first_move_type") && !attSide.volatile[ai]?.firstMoveTypeDone){
    const firstType=effectiveMoveType(a,move); a.type=[firstType]; attSide.volatile[ai].firstMoveTypeDone=true;
    b.log.push(`${a.name}は${firstType}タイプになった！`);
  }
  const moveType=effectiveMoveType(a,move);
  const chance=()=>effectRoll(move);
  const opponentPending=attSide===b.player ? b.pendingEnemyMoveId : b.pendingPlayerMoveId;
  const opponentPendingMove=opponentPending?getMove(opponentPending):null;
  if((effects.includes("opponent_physical_only") || move.opponentCategory==="physical") && (!opponentPendingMove || opponentPendingMove.category!=="physical")) return {switched:false};
  if((effects.includes("opponent_special_only") || move.opponentCategory==="special") && (!opponentPendingMove || opponentPendingMove.category!=="special")) return {switched:false};
  let switched=false;

  // 複数効果を順番に処理する。攻撃技にも変化効果を併設できる。
  if(effects.includes("stealth_rock") && chance()) setHazard(b,attSide,"stealth_rock");
  if(effects.includes("spikes") && chance()) setHazard(b,attSide,"spikes");
  if(effects.includes("set_weather") && chance()) setWeather(b,move.weather,Number(move.duration||5),attSide);
  if(effects.includes("set_field") && chance()) setField(b,move.field,Number(move.fieldDuration||move.duration||5),attSide);
  for(const wall of ["light_screen","reflect","aurora_veil"]){if(effects.includes(wall)&&chance()) setWall(b,attSide,wall,Number(move.duration||5));}
  if(effects.includes("protect") && chance()){attSide.protected[ai]=true;b.log.push(`${a.name}はまもるを使った！`);}
  if(effects.includes("recover") && chance()){const heal=Math.max(1,Math.floor(attSide.maxHp[ai]/2));attSide.hp[ai]=Math.min(attSide.maxHp[ai],attSide.hp[ai]+heal);b.log.push(`${a.name}は${heal}回復した！`);}
  if(target==="field"){
    if(effects.includes("stealth_rock")||effects.includes("spikes")||effects.some(e=>["set_weather","set_field","light_screen","reflect","aurora_veil"].includes(e))) return {switched:false};
    return {switched:false};
  }
  if(effects.includes("swords_dance") && chance()) addBoost(b,attSide,ai,"attack",2);
  if(effects.includes("nasty_plot") && chance()) addBoost(b,attSide,ai,"spAttack",2);
  if(effects.includes("dragon_dance") && chance()){addBoost(b,attSide,ai,"attack",1);addBoost(b,attSide,ai,"speed",1);}
  if((effects.includes("stat_boost")||effects.includes("stat_drop")) && chance()){
    const keys=effectStatKeys(move);
    const amount=(effects.includes("stat_drop")&&!effects.includes("stat_boost")?-1:1)*clamp(Number(move.effectStages||1),1,3);
    const target=move.effectTarget==="opponent"?defSide:attSide;const ti=move.effectTarget==="opponent"?di:ai;
    for(const key of keys) addBoost(b,target,ti,key,amount,attSide);
  }

  const power=Number(move.power||0);
  if(power<=0){
    if(targetSide && effects.includes("remove_item") && d.hp[di]>0 && chance() && itemId(d)){const oldItem=getItem(itemId(d)); if(!isMegaStone(oldItem)){d.itemId=null;d.item=null;defSide.itemLost[di]=true;b.log.push(`${d.name}の持ち物「${oldItem?.name||""}」がなくなった！`);} else { b.log.push(`${d.name}のメガストーンはなくならなかった！`); }}
    if(targetSide && effects.includes("change_opponent_type") && d.hp[di]>0 && chance()){const types=Array.isArray(move.effectAddTypes)?move.effectAddTypes.filter(t=>ALL_TYPES.includes(t)):[move.effectAddType].filter(t=>ALL_TYPES.includes(t));d.type=types;b.log.push(`${d.name}のタイプが${types.length?types.join("・"):"なし"}になった！`);}
    if(targetSide && (move.status||effects.includes("inflict_status")) && d.hp[di]>0 && chance() && move.status) setStatus(b,defSide,di,move.status,move.category==="status");
    if(targetSide && effects.includes("flinch") && d.hp[di]>0 && chance()){defSide.volatile[di].flinch=true;b.log.push(`${d.name}はひるみそうだ！`);}
    return {switched:false};
  }

  if(!d) return {switched:false};
  if(moveHasEffect(move,"confusion_attack")){
    const base=Math.floor(Math.floor((2*50/5+2)*40*statWithBoost(attSide,ai,"attack")/Math.max(1,statWithBoost(attSide,ai,"defense")))/50)+2;
    const damage=Math.max(1,Math.floor(base*(0.85+Math.random()*0.15)));
    attSide.hp[ai]=Math.max(0,attSide.hp[ai]-damage);
    b.log.push(`自分の${a.name}のこんらん攻撃！${damage}ダメージ。`);
    return {switched:false};
  }
  if(moveIsTypeInvalid(b,attSide,defSide,move)){b.log.push(`${a.name}の${move.name}はタイプ相性で無効なので使えない！`);return {switched:false};}
  const noMiss=abilityHasEffect(a,"no_miss_both") || abilityHasEffect(d,"no_miss_both");
  const acc=Number(move.accuracy??100);if(!noMiss && acc<100&&Math.random()*100>=acc){b.log.push(`${attSide===b.player?"自分":"相手"}の${a.name}の技「${move.name}」は外れた！`);return {switched:false};}
  if(defSide.protected[di]){b.log.push(`相手の${d.name}はまもっている！`);return {switched:false};}
  const preview=calcDamage(b,attSide,defSide,move);
  if(preview.mult!==0) triggerReceivedTypeStatBoost(b,attSide,defSide,move,di);
  const r=preview;
  if(r.mult===0){b.log.push(`${attSide===b.player?"自分":"相手"}の${a.name}の技「${move.name}」！しかし効果がない！`);return {switched:false};}
  let damage=r.damage, survivedByAbility=false;
  for(const ab of abilityDataList(d)){
    if(abilityEffects(ab).includes("disguise_like") && defSide.disguiseBroken?.[di]!==true && damage>0){
      damage=0; defSide.disguiseBroken[di]=true; survivedByAbility=true; b.log.push(`${d.name}の特性「${ab.name||"特性"}」で最初の攻撃を耐えた！`); break;
    }
    if(abilityEffects(ab).includes("survive_once_1_8") && defSide.volatile[di]?.surviveOnce!==true && damage>=defSide.hp[di]){damage=Math.max(0,defSide.hp[di]-1);defSide.volatile[di].surviveOnce=true;survivedByAbility=true;b.log.push(`${d.name}の特性「${ab.name||"特性"}」で攻撃を耐えた！`);break;}
  }
  if(!survivedByAbility && hasFullHpSurvival(d,moveType) && defSide.hp[di]===defSide.maxHp[di] && damage>=defSide.hp[di]){damage=Math.max(1,defSide.hp[di]-1);b.log.push(`${d.name}はHP満タンの効果で攻撃を1残して耐えた！`);}
  defSide.hp[di]=Math.max(0,defSide.hp[di]-damage);
  if(survivedByAbility){ for(const ab of abilityDataList(d)){ if(abilityEffects(ab).includes("disguise_like")){ const chip=Math.max(1,Math.floor(defSide.maxHp[di]/8)); defSide.hp[di]=Math.max(1,defSide.hp[di]-chip); b.log.push(`${d.name}は特性の効果で最大HPの1/8を失った！`); break; } } }
  if(defSide.hp[di]>0) triggerHalfHpHeal(b,defSide,di);
  if(defSide.hp[di]>0 && move.contact){
    if(abilityHasEffect(d,"contact_revenge")){
      const rd=Math.max(1,Math.floor(defSide.maxHp[di]/8));
      attSide.hp[ai]=Math.max(0,attSide.hp[ai]-rd);
      b.log.push(`${a.name}は${d.name}の特性で最大HPの1/8のダメージを受けた！`);
    }
    const revengeItem=itemWorks(d,moveType);
    if(revengeItem?.effect==="contact_revenge_item"){
      const rd=Math.max(1,Math.floor(defSide.maxHp[di]/8));
      attSide.hp[ai]=Math.max(0,attSide.hp[ai]-rd);
      b.log.push(`${a.name}は${d.name}の持ち物「${revengeItem.name||itemId(d)}」で最大HPの1/8のダメージを受けた！`);
    }
  }
  const extra=r.mult>1?" 効果はばつぐんだ！":r.mult<1?" 効果はいまひとつのようだ。":"";
  const typeNote=r.moveType!==move.type?`（タイプが${r.moveType}）`:"";
  b.log.push(`${attSide===b.player?"自分":"相手"}の${a.name}の技「${move.name}」！${typeNote}${defSide===b.player?"自分":"相手"}の${d.name}に${damage}ダメージ。${extra}`);
  for(const ab of abilityDataList(d)){ if(abilityEffects(ab).includes("force_switch_half_hp") && defSide.hp[di]>0 && defSide.hp[di]<=defSide.maxHp[di]/2 && !defSide.volatile[di]?.forcedSwitchTriggered){ defSide.volatile[di].forcedSwitchTriggered=true; defSide.volatile[di].forceSwitch=true; b.log.push(`${d.name}の特性「${ab.name||"特性"}」で強制的に交代する！`); } }
  if(effects.includes("heal_half_damage") && damage>0){const heal=Math.max(1,Math.floor(damage/2));const before=attSide.hp[ai];attSide.hp[ai]=Math.min(attSide.maxHp[ai],attSide.hp[ai]+heal);b.log.push(`${attSide===b.player?"自分":"相手"}の${a.name}は与えたダメージの1/2、${attSide.hp[ai]-before}回復した！`);}
  if(defSide.hp[di]>0 && effects.includes("confuse_opponent") && chance()) setConfusion(b,defSide,di);
  if(defSide.hp[di]>=0 && effects.includes("recoil_damage") && damage>0){ const mult=Number(move.recoilMultiplier??0.25); const rd=Math.max(1,Math.floor(damage*Math.max(0,mult))); attSide.hp[ai]=Math.max(0,attSide.hp[ai]-rd); b.log.push(`${attSide===b.player?"自分":"相手"}の${a.name}は反動で${rd}ダメージを受けた！`); }

  const recoilItem=getItem(itemId(a));
  if(recoilItem?.effect==="life_orb"&&defSide.hp[di]>0){const rd=Math.max(1,Math.floor(attSide.maxHp[ai]/10));attSide.hp[ai]=Math.max(0,attSide.hp[ai]-rd);b.log.push(`自分の${a.name}はいのちのたまで反動を受けた。`);}
  if(recoilItem?.effect==="power_1_3_recoil"&&defSide.hp[di]>0){const rd=Math.max(1,Math.floor(attSide.maxHp[ai]/16));attSide.hp[ai]=Math.max(0,attSide.hp[ai]-rd);b.log.push(`自分の${a.name}は持ち物の反動で最大HPの1/16を失った。`);}
  for(const aid of abilityIds(a)){const ab=getAbility(aid);if(!abilityEffects(ab).includes("power_1_3_recoil")||!effectTypesMatch(ab,move.type))continue;const rd=Math.max(1,Math.floor(attSide.maxHp[ai]/16));attSide.hp[ai]=Math.max(0,attSide.hp[ai]-rd);b.log.push(`自分の${a.name}は特性の反動で最大HPの1/16を失った。`);break;}

  if(defSide.hp[di]>0 && effects.includes("remove_item") && chance() && itemId(d)){const oldItem=getItem(itemId(d)); if(!isMegaStone(oldItem)){d.itemId=null;d.item=null;defSide.itemLost[di]=true;b.log.push(`${d.name}の持ち物「${oldItem?.name||""}」がなくなった！`);} else { b.log.push(`${d.name}のメガストーンはなくならなかった！`); }}
  if(defSide.hp[di]>0 && effects.includes("change_opponent_type") && chance()){const types=Array.isArray(move.effectAddTypes)?move.effectAddTypes.filter(t=>ALL_TYPES.includes(t)):[move.effectAddType].filter(t=>ALL_TYPES.includes(t));d.type=types;b.log.push(`${d.name}のタイプが${types.length?types.join("・"):"なし"}になった！`);}
  if(defSide.hp[di]>0 && (move.status||effects.includes("inflict_status")) && chance() && move.status) setStatus(b,defSide,di,move.status,move.category==="status");
  if(defSide.hp[di]>0 && effects.includes("flinch") && chance()) defSide.volatile[di].flinch=true;
  if(defSide.hp[di]>0 && effects.includes("attack_then_switch")){const alive=attSide.selected.filter(x=>x!==ai&&attSide.hp[x]>0);if(alive.length){b.log.push(`${a.name}は攻撃後に交代する！`);switched=true;}}
  return {switched};
}
function megaEvolve(b,side){
  normalizeBattleState(b);
  if(b.over) throw new Error("この対戦は終了しています。");
  if(b.phase!=="battle") throw new Error("現在はメガ進化できません。");
  if(side.megaUsed) throw new Error("この対戦ではすでにメガ進化しています。");
  if(side.megaThisTurn) throw new Error("このターンはすでにメガ進化しています。");
  const i=side.active;
  if(!Number.isInteger(i)||i<0||i>=side.team.length) throw new Error("場のポケモンが設定されていません。");
  const p=side.team[i], m=p.mega;
  const heldItem=getItem(itemId(p));
  if(!isMegaStone(heldItem)) throw new Error(`${p.name}はメガストーンを持っていないためメガ進化できません。`);
  if(!m?.enabled) throw new Error(`${p.name}はメガ進化できません。`);
  if(!m.stats || Object.values(m.stats).some(v=>!Number(v))) throw new Error("メガ進化後のステータスが設定されていません。");
  const oldName=p.name;
  p.name=m.name||`メガ${p.name}`;
  p.type=Array.isArray(m.type)&&m.type.length?m.type:p.type;
  p.abilities=m.ability?[m.ability]:p.abilities;
  p.stats={...p.stats,...m.stats};
  p._mega=true; side.megaUsed=true; side.megaThisTurn=true;
  const oldMax=side.maxHp[i], newMax=statValue(p,"hp");
  const hpRatio=oldMax>0?side.hp[i]/oldMax:1;
  side.maxHp[i]=newMax; side.hp[i]=Math.max(1,Math.min(newMax,Math.floor(newMax*hpRatio)));
  b.log.push(`${oldName}はメガ進化して${p.name}になった！`);
  // メガ進化は「交代」ではないため、場に出た時の特性・天候・持ち物処理を再発動しない。
}

function scoreEnemyMove(b,m){
  if(!m)return -999;
  if(moveIsTypeInvalid(b,b.enemy,b.player,m))return -999;
  let s=0; const power=Number(m.power||0);
  if(power>0){ const r=calcDamage(b,b.enemy,b.player,m); s+=r.damage; if(r.mult>1)s+=40*r.mult; }
  const es=moveEffectsOf(m);
  if(es.includes("recover") && b.enemy.hp[b.enemy.active]<b.enemy.maxHp[b.enemy.active]/2)s+=70;
  if(es.some(x=>["swords_dance","nasty_plot","dragon_dance","stat_boost"].includes(x)))s+=35;
  if(es.includes("protect"))s+=20;
  if(es.includes("stealth_rock")&&!b.enemy.hazards.stealth_rock)s+=25;
  if(es.includes("spikes")&&b.enemy.hazards.spikes<3)s+=20;
  return s+Math.random()*8;
}
function scoreEnemySwitch(b,i){
  const p=b.enemy.team[i]; if(!p||b.enemy.hp[i]<=0)return -999;
  const defTypes=speciesTypes(p); const cur=b.player.team[b.player.active];
  let s=20+(b.enemy.hp[i]/b.enemy.maxHp[i])*30;
  for(const id of (cur.moves||[])){const m=getMove(id);if(!m||Number(m.power||0)<=0)continue;let mult=1;for(const t of defTypes)mult*=TYPE_CHART[m.type]?.[t]??1;s-=mult*12;}
  return s+Math.random()*5;
}
function chooseEnemyAction(b){
  const p=b.enemy.team[b.enemy.active], ids=Array.isArray(p?.moves)?p.moves:[];
  const usable=ids.map(getMove).filter(Boolean);
  const valid=usable.filter(m=>!moveIsTypeInvalid(b,b.enemy,b.player,m));
  const moves=valid.length?valid:usable;
  let bestMove=null,bestScore=-999; for(const m of moves){const sc=scoreEnemyMove(b,m);if(sc>bestScore){bestScore=sc;bestMove=m;}}
  let bestSwitch=null,bestSwitchScore=-999; for(const i of b.enemy.selected||[]){if(i!==b.enemy.active){const sc=scoreEnemySwitch(b,i);if(sc>bestSwitchScore){bestSwitchScore=sc;bestSwitch=i;}}}
  if(bestSwitch!==null && bestSwitchScore>bestScore) return {type:"switch",index:bestSwitch,score:bestSwitchScore};
  return {type:"move",move:bestMove||{id:"tackle",name:"たいあたり",type:"ノーマル",power:40,category:"physical",priority:0,target:"opponent",accuracy:100},score:bestScore};
}
function chooseEnemyMove(b){return chooseEnemyAction(b).move;}
function priorityWithAbility(b,side,move,otherSide){
  let p=Number(move.priority||0);
  if(b.field==="grassy" && moveHasEffect(move,"grassy_priority_plus_1")) p+=1;

  if(move.category==="status" && abilityHasEffect(side.team[side.active],"status_priority_plus_1")){
    const other=otherSide?.team?.[otherSide.active];
    if(!speciesTypes(other).includes("あく")) p+=1;
    else b.log.push(`${side.team[side.active].name}はあくタイプの相手に対して特性の優先度上昇効果を発揮できない！`);
  }
  return p;
}
function chooseTurnOrder(b,pm,em){
  const pp=priorityWithAbility(b,b.player,pm,b.enemy);
  const ep=priorityWithAbility(b,b.enemy,em,b.player);
  if(pp!==ep)return pp>ep?["player","enemy"]:["enemy","player"];
  const ps=effectiveSpeed(b.player,b.player.team[b.player.active]),es=effectiveSpeed(b.enemy,b.enemy.team[b.enemy.active]);
  if(ps===es)return Math.random()<0.5?["player","enemy"]:["enemy","player"];
  return ps>es?["player","enemy"]:["enemy","player"];
}
function chooseEnemySwitch(b){
  const alive=b.enemy.selected.filter(i=>b.enemy.hp[i]>0&&i!==b.enemy.active);
  if(!alive.length)return null;
  if(b.enemy.hp[b.enemy.active]>0 && b.enemy.hp[b.enemy.active]>b.enemy.maxHp[b.enemy.active]/2)return null;
  return alive.sort((x,y)=>b.enemy.hp[x]-b.enemy.hp[y]).pop();
}
function resolveFaints(b){
  for(const side of [b.player,b.enemy]){
    const i=side.active;
    if(side.hp[i]>0)continue;
    if(!side.logFainted?.[i]){side.logFainted=side.logFainted||{};side.logFainted[i]=true;b.log.push(`${side===b.player?"自分":"相手"}の${side.team[i].name}は戦闘不能！`);}
    const alive=side.selected.filter(x=>side.hp[x]>0);
    if(!alive.length){b.over=true;b.result=side===b.player?"lose":"win";b.log.push(side===b.player?"自分の3匹が戦闘不能。あなたの敗北です。":"相手の3匹が戦闘不能。あなたの勝利です！");continue;}
    if(side===b.enemy){const n=chooseEnemySwitch(b);if(n!==null&&n!==undefined){side.active=n;b.log.push(`相手は${side.team[n].name}を繰り出した！`);applySwitchIn(b,side);}}
    else if(!b.over){ b.phase="switch_required"; b.log.push("戦闘不能になったため、次のポケモンを選んでください。"); }
  }
}
function prepareTurn(b){b.player.protected.fill(false);b.enemy.protected.fill(false);for(const s of [b.player,b.enemy]){const v=s.volatile[s.active];if(v)v.flinch=false;}}
function runTurn(b,playerMoveId){
  normalizeBattleState(b);
  if(b.over)throw new Error("この対戦は終了しています。");
  if(b.phase!=="battle")throw new Error("現在は行動を選択できません。");
  if(!Number.isInteger(b.player.active)||b.player.active<0)throw new Error("自分の場のポケモンが設定されていません。");
  if(!Number.isInteger(b.enemy.active)||b.enemy.active<0)throw new Error("相手の場のポケモンが設定されていません。");
  const pm=getMove(String(playerMoveId));if(!pm)throw new Error("技が見つかりません。");
  b.pendingPlayerMoveId=String(pm.id);
  const p=b.player.team[b.player.active];if(!Array.isArray(p.moves)||!p.moves.map(String).includes(String(pm.id)))throw new Error("その技は使用できません。");
  // 変化技（つるぎのまい・わるだくみ等）はダメージ0でも「1回の行動」として完了させる。
  // 相手側の技取得に失敗してもフォールバック技で必ずターンを進める。
  let enemyAction=b.pendingEnemyAction||null;
  if(!enemyAction){ enemyAction=chooseEnemyAction(b); }
  if(enemyAction?.type==="move" && !enemyAction.move){ enemyAction={...enemyAction,move:getMove(String(enemyAction.moveId||enemyAction.id||""))}; }
  const em=enemyAction.type==="move"?(enemyAction.move||chooseEnemyMove(b)):null;
  if(em) b.pendingEnemyMoveId=String(em.id); else b.pendingEnemyMoveId=null;
  prepareTurn(b);
  const order=chooseTurnOrder(b,pm,em);
  for(const who of order){
    if(b.over)break;
    const as=who==="player"?b.player:b.enemy,ds=who==="player"?b.enemy:b.player,m=who==="player"?pm:em;
    if(as.hp[as.active]<=0)continue;
    if(as.volatile[as.active]?.flinch){b.log.push(`${as.team[as.active].name}はひるんで動けない！`);continue;}
    // doMove は変化技でも必ず戻り値を返す。例外時も runTurn 全体を壊さずUI側で表示できるようにする。
    const result=doMove(b,as,ds,m) || {switched:false};
    resolveFaints(b);
    if(!b.over && result?.switched && as.hp[as.active]>0){
      if(as===b.player){ b.phase="switch_required"; }
      else { const n=chooseEnemySwitch(b); if(n!==null&&n!==undefined){as.active=n;b.log.push(`相手は${as.team[n].name}を繰り出した！`);applySwitchIn(b,as);} }
    }
    if(b.phase==="switch_required") break;
  }
  if(!b.over && b.phase==="battle"){endTurnSide(b,b.player);endTurnSide(b,b.enemy);resolveFaints(b);}
  if(!b.over && b.phase==="battle"){
    b.player.megaThisTurn=false; b.enemy.megaThisTurn=false;
    if(b.weather){b.weatherTurns--;if(b.weatherTurns<=0){b.log.push(`天候の${WEATHER_NAMES[b.weather]||b.weather}が消えた！`);b.weather=null;b.weatherTurns=0;}}
    if(b.field){b.fieldTurns--;if(b.fieldTurns<=0){b.log.push(`フィールドの${FIELD_NAMES[b.field]||b.field}が消えた！`);b.field=null;b.fieldTurns=0;}}
    for(const side of [b.player,b.enemy]) for(const w of Object.keys(WALL_NAMES)){if(side.walls[w]>0){side.walls[w]--;if(side.walls[w]===0)b.log.push(`${WALL_NAMES[w]}が消えた！`);}}
    b.turn++;
    b.pendingEnemyMoveId=null;
    b.pendingPlayerMoveId=null;
    b.pendingEnemyAction=null;
    if(!b.over && b.phase==="battle") { const next=chooseEnemyAction(b); b.pendingEnemyAction=next; if(next.type==="move"&&next.move) b.pendingEnemyMoveId=String(next.move.id); }
  }
}


  function makeOnlineBattle(playerTeamIds,enemyTeamIds){
  if(!Array.isArray(playerTeamIds)||playerTeamIds.length!==6||!Array.isArray(enemyTeamIds)||enemyTeamIds.length!==6)throw new Error("双方6匹のパーティが必要です。");
  const pt=getSpeciesByIds(playerTeamIds),et=getSpeciesByIds(enemyTeamIds); if(pt.length!==6||et.length!==6)throw new Error("登録済みポケモンを取得できませんでした。");
  return normalizeBattleState({id:crypto.randomUUID(),turn:1,phase:"selection",over:false,result:null,weather:null,field:null,pendingEnemyMoveId:null,pendingPlayerMoveId:null,pendingEnemyAction:null,cpuBattle:false,player:initSide(pt,[]),enemy:initSide(et,[]),log:["オンライン対戦開始。双方3匹を選出してください。"]});
}
function startOnlineSelection(b,playerSelected,enemySelected){
  if(!Array.isArray(playerSelected)||playerSelected.length!==3||!Array.isArray(enemySelected)||enemySelected.length!==3)throw new Error("双方3匹を選出してください。");
  b.player.selected=[...playerSelected]; b.enemy.selected=[...enemySelected]; b.player.active=playerSelected[0]; b.enemy.active=enemySelected[0]; b.phase="battle"; applySwitchIn(b,b.player); applySwitchIn(b,b.enemy); b.pendingEnemyAction=null; return b;
}
function finishOnlineTurnAfterForcedSwitch(b){
  if(b.over) return b;
  if(b.phase!=="battle") return b;
  endTurnSide(b,b.player); endTurnSide(b,b.enemy); resolveFaints(b);
  if(b.over) return b;
  b.player.megaThisTurn=false; b.enemy.megaThisTurn=false;
  if(b.weather){b.weatherTurns--;if(b.weatherTurns<=0){b.log.push(`天候の${WEATHER_NAMES[b.weather]}が消えた！`);b.weather=null;b.weatherTurns=0;}}
  if(b.field){b.fieldTurns--;if(b.fieldTurns<=0){b.log.push(`フィールドの${FIELD_NAMES[b.field]}が消えた！`);b.field=null;b.fieldTurns=0;}}
  for(const side of [b.player,b.enemy]) for(const w of Object.keys(WALL_NAMES)){
    if(side.walls[w]>0){side.walls[w]--;if(side.walls[w]===0)b.log.push(`${WALL_NAMES[w]}が消えた！`);}
  }
  b.turn++;
  b.pendingEnemyMoveId=null; b.pendingPlayerMoveId=null; b.pendingEnemyAction=null;
  b.onlineForcedSwitchSide=null;
  return b;
}
function runOnlineForcedSwitchMove(b,sideName,action){
  normalizeBattleState(b);
  if(b.over) throw new Error("この対戦は終了しています。");
  if(b.phase!=="battle") throw new Error("現在は交代技を使用できません。");
  const side=sideName==="player"?b.player:b.enemy;
  const other=sideName==="player"?b.enemy:b.player;
  const i=side.active;
  const move=getMove(String(action?.moveId||action?.id||""));
  if(!move) throw new Error("技が見つかりません。");
  const p=side.team[i];
  if(!Array.isArray(p.moves)||!p.moves.map(String).includes(String(move.id))) throw new Error("その技は使用できません。");
  if(!moveHasEffect(move,"attack_then_switch")) throw new Error("この技は攻撃後交代技ではありません。");
  prepareTurn(b);
  const result=doMove(b,side,other,move)||{switched:false};
  resolveFaints(b);
  const alive=side.selected.filter(x=>x!==i&&side.hp[x]>0);
  if(!b.over && result.switched && alive.length){
    b.phase="online_switch_required";
    b.onlineForcedSwitchSide=sideName;
    b.pendingForcedSwitch={side:sideName,from:i};
    b.log.push(`${side===b.player?"自分":"相手"}は交代先を選んでください。`);
    return b;
  }
  return finishOnlineTurnAfterForcedSwitch(b);
}
function completeOnlineForcedSwitch(b,sideName,index){
  normalizeBattleState(b);
  if(b.over) throw new Error("この対戦は終了しています。");
  if(b.phase!=="online_switch_required"||b.onlineForcedSwitchSide!==sideName) throw new Error("現在はこの交代を選択できません。");
  const side=sideName==="player"?b.player:b.enemy;
  const i=Number(index);
  if(!Number.isInteger(i)||!side.selected.includes(i)||i===side.active||side.hp[i]<=0) throw new Error("そのポケモンには交代できません。");
  const old=side.team[side.active].name;
  side.active=i;
  b.log.push(`${side===b.player?"自分":"相手"}は${old}から${side.team[i].name}に交代した！`);
  applySwitchIn(b,side);
  b.phase="battle";
  b.pendingForcedSwitch=null;
  return finishOnlineTurnAfterForcedSwitch(b);
}

function runOnlineTurn(b,playerAction,enemyAction){
  if(playerAction?.type==="move" && enemyAction?.type==="move"){ b.pendingEnemyAction=enemyAction; b.pendingEnemyMoveId=String(enemyAction.moveId||enemyAction.id||""); return runTurn(b,String(playerAction.moveId||playerAction.id)); }
  normalizeBattleState(b); prepareTurn(b);
  const actions=[{side:b.player,other:b.enemy,act:playerAction},{side:b.enemy,other:b.player,act:enemyAction}];
  actions.sort((x,y)=>{const px=x.act?.type==="switch"?6:priorityWithAbility(b,x.side,getMove(x.act?.moveId||x.act?.id)||{},x.other);const py=y.act?.type==="switch"?6:priorityWithAbility(b,y.side,getMove(y.act?.moveId||y.act?.id)||{},y.other);if(px!==py)return py-px;const sx=effectiveSpeed(x.side,x.side.team[x.side.active]),sy=effectiveSpeed(y.side,y.side.team[y.side.active]);return sy-sx;});
  for(const x of actions){if(b.over)break;const side=x.side,other=x.other,act=x.act||{};if(act.type==="switch"){const n=Number(act.index);if(side.selected.includes(n)&&side.hp[n]>0&&n!==side.active){side.active=n;b.log.push(`${side===b.player?"自分":"相手"}は${side.team[n].name}に交代した！`);applySwitchIn(b,side);}continue;}const m=getMove(act.moveId||act.id);if(m)doMove(b,side,other,m);resolveFaints(b);}
  if(!b.over&&b.phase==="battle"){endTurnSide(b,b.player);endTurnSide(b,b.enemy);resolveFaints(b);if(b.weather){b.weatherTurns--;if(b.weatherTurns<=0){b.log.push(`天候の${WEATHER_NAMES[b.weather]}が消えた！`);b.weather=null;b.weatherTurns=0;}}if(b.field){b.fieldTurns--;if(b.fieldTurns<=0){b.log.push(`フィールドの${FIELD_NAMES[b.field]}が消えた！`);b.field=null;b.fieldTurns=0;}}b.turn++;}
  return b;
}

  return {
    setContent(rows){ battleData.content = Array.isArray(rows) ? rows : []; },
    makeBattle,
    normalizeBattleState,
    publicBattle,
    runTurn,
    megaEvolve,
    applySwitchIn,
    doMove,
    prepareTurn,
    resolveFaints,
    chooseEnemyMove,
    chooseEnemyAction,
    makeOnlineBattle,
    startOnlineSelection,
    runOnlineTurn,
    runOnlineForcedSwitchMove,
    completeOnlineForcedSwitch,
    moveIsTypeInvalid,
    moveTypeMultiplier
  };
})();
