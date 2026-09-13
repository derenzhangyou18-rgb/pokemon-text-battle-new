/* global supabase */
(function(){
  const cfg=window.SUPABASE_CONFIG||{};
  if(!cfg.url||cfg.url.includes('YOUR-PROJECT')||!cfg.key||cfg.key.includes('YOUR_SUPABASE')){
    window.SB=null;
    window.SB_CONFIGURED=false;
    return;
  }
  window.SB=supabase.createClient(cfg.url,cfg.key);
  window.SB_CONFIGURED=true;
})();
