type GoogleImaSettings = {
  setPageUrl?: (url: string) => void;
};

type GoogleImaAdsRequestCtor = new () => {
  descriptionUrl?: string;
  contentUrl?: string;
  url?: string;
  pageUrl?: string;
};

type GoogleImaNamespace = {
  settings?: GoogleImaSettings;
  AdsRequest?: (GoogleImaAdsRequestCtor & { __patched?: boolean; prototype: unknown });
};

interface Window {
  google?: {
    ima?: GoogleImaNamespace;
  };
}

const gameContainer = document.getElementById("gameContainer");
const googleScriptUrl =
  "https://script.google.com/macros/s/AKfycbxNbvNHQi6AaM1h7e1N4T2gkDUR3CMeqDfto6yUKf4DKrOELGCCT4maR8rwUvL3EAXg/exec";
const gameXmlUrl =
  "https://30807041-467781186649291600.preview.editmysite.com/uploads/b/152798200-425123953801271878/files/ar.xml";
const faviconUrl = "https://ssl.gstatic.com/classroom/favicon.png";
const pageTitle = "classroom.google.com";

const playPrimaryInlineBtn = document.getElementById("playPrimaryInline") as HTMLButtonElement | null;
const playPrimaryFullscreenBtn = document.getElementById("playPrimaryFullscreen") as HTMLButtonElement | null;
const playAltInlineBtn = document.getElementById("playAltInline") as HTMLButtonElement | null;
const playAltFullscreenBtn = document.getElementById("playAltFullscreen") as HTMLButtonElement | null;

let readyHtmlContent: string | null = null;

function installGameButtons(): void {
  if (playPrimaryInlineBtn) {
    playPrimaryInlineBtn.addEventListener("click", () => {
      if (!gameContainer) return;
      gameContainer.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.src = googleScriptUrl;
      gameContainer.appendChild(iframe);
    });
  }

  if (playPrimaryFullscreenBtn) {
    playPrimaryFullscreenBtn.addEventListener("click", () => {
      const popup = window.open("", "_blank");
      if (!popup) {
        alert("Please allow popups for this site.");
        return;
      }

      popup.document.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>${pageTitle}</title>
          <link rel="icon" href="${faviconUrl}">
          <style>
            html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
            iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${googleScriptUrl}" allowfullscreen></iframe>
        </body>
      </html>`);
    });
  }

  if (playAltInlineBtn) {
    playAltInlineBtn.addEventListener("click", () => launchAltGame(true));
  }

  if (playAltFullscreenBtn) {
    playAltFullscreenBtn.addEventListener("click", () => launchAltGame(false));
  }
}

async function prepareGameContent(): Promise<void> {
  try {
    const response = await fetch(gameXmlUrl);
    if (!response.ok) {
      throw new Error(`Failed to load XML: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");
    const contentNode = xmlDoc.querySelector("Content");

    if (!contentNode) {
      throw new Error("<Content> not found in XML");
    }

    const htmlSource = contentNode.textContent ?? "";
    const htmlDoc = parser.parseFromString(htmlSource, "text/html");

    if (!htmlDoc.head) {
      const head = htmlDoc.createElement("head");
      htmlDoc.documentElement.insertBefore(head, htmlDoc.documentElement.firstChild);
    }

    let titleNode = htmlDoc.querySelector("title");
    if (!titleNode) {
      titleNode = htmlDoc.createElement("title");
      htmlDoc.head.appendChild(titleNode);
    }
    titleNode.textContent = pageTitle;

    const faviconLink = htmlDoc.createElement("link");
    faviconLink.rel = "icon";
    faviconLink.href = faviconUrl;
    htmlDoc.head.appendChild(faviconLink);

    const styleReset = htmlDoc.createElement("style");
    styleReset.textContent = "html, body, #container { margin: 0; padding: 0; width: 100% !important; height: 100% !important; overflow: hidden !important; }";
    htmlDoc.head.appendChild(styleReset);

    let baseUrl = gameXmlUrl.substring(0, gameXmlUrl.lastIndexOf("/") + 1);
    if (gameXmlUrl.startsWith("data:")) {
      baseUrl = window.location.href;
    }

    const baseTag = htmlDoc.createElement("base");
    baseTag.href = baseUrl;
    htmlDoc.head.prepend(baseTag);

    const injectedDomain = JSON.stringify(window.location.hostname);
    const injectedHref = JSON.stringify(window.location.href);
    const manualSiteUrl = JSON.stringify("https://sites.google.com");
    const baseForRel = JSON.stringify(baseUrl);

    const script = htmlDoc.createElement("script");
    const scriptLines: string[] = [
      "(function(){",
      `  const injectedHref = ${injectedHref};`,
      `  const siteUrl = ${manualSiteUrl};`,
      `  const injectedDomain = ${injectedDomain};`,
      `  const BASE_FOR_REL = ${baseForRel};`,
      "  function hookIMA() {",
      "    let _google = window.google;",
      "    Object.defineProperty(window, 'google', {",
      "      configurable: true, enumerable: true,",
      "      get: function() { return _google; },",
      "      set: function(v) {",
      "        _google = v;",
      "        if (v && v.ima) {",
      "          if (v.ima.settings && v.ima.settings.setPageUrl) {",
      "            v.ima.settings.setPageUrl(siteUrl);",
      "          }",
      "          if (v.ima.AdsRequest && !v.ima.AdsRequest.__patched) {",
      "            const OriginalAdsRequest = v.ima.AdsRequest;",
      "            v.ima.AdsRequest = function() {",
      "              const req = new OriginalAdsRequest();",
      "              req.descriptionUrl = siteUrl;",
      "              req.contentUrl = siteUrl;",
      "              req.url = siteUrl;",
      "              req.pageUrl = siteUrl;",
      "              return req;",
      "            };",
      "            v.ima.AdsRequest.prototype = OriginalAdsRequest.prototype;",
      "            v.ima.AdsRequest.__patched = true;",
      "          }",
      "        }",
      "      }",
      "    });",
      "  }",
      "  hookIMA();",
      "  setInterval(function() {",
      "    if (window.google && window.google.ima) {",
      "      if (window.google.ima.settings && window.google.ima.settings.setPageUrl) { window.google.ima.settings.setPageUrl(siteUrl); }",
      "      if (window.google.ima.AdsRequest && !window.google.ima.AdsRequest.__patched) {",
      "        const OriginalAdsRequest = window.google.ima.AdsRequest;",
      "        window.google.ima.AdsRequest = function() {",
      "          const req = new OriginalAdsRequest();",
      "          req.descriptionUrl = siteUrl;",
      "          req.contentUrl = siteUrl;",
      "          req.url = siteUrl;",
      "          return req;",
      "        };",
      "        window.google.ima.AdsRequest.prototype = OriginalAdsRequest.prototype;",
      "        window.google.ima.AdsRequest.__patched = true;",
      "      }",
      "    }",
      "  }, 50);",
      "  const AD_HOSTS = ['gamemonetize.com', 'gamedistribution.com'];",
      "  function isAdHost(url){ try { return AD_HOSTS.some(h => url.includes(h)); } catch(e){ return false; } }",
      "  function absolutize(url){ try{ new URL(url); return url; }catch(e){ try { return new URL(url, BASE_FOR_REL).href; } catch(e2){ return url; } } }",
      "  function patchDomainParamToUrl(u){ try{ if(!(u instanceof URL)) u=new URL(u,location.href); const cur=u.searchParams.get('domain'); if(!cur||cur.trim()===''||cur.toLowerCase().startsWith('blob')){ u.searchParams.set('domain', injectedDomain); } return u.toString(); }catch(e){ return u.toString?u.toString():u; } }",
      "  const _fetch=window.fetch; window.fetch=function(i,n){ try{ let u=null; if(typeof i==='string')u=i; else if(i instanceof Request)u=i.url; if(u){ try{ new URL(u);}catch(e){u=absolutize(u);} if(isAdHost(u)){ const p=patchDomainParamToUrl(new URL(u,location.href)); i=(typeof i==='string')?p:new Request(p,i); } } }catch(e){} return _fetch.call(this,i,n); };",
      "  try{ const _o=XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open=function(m,u,a,s,p){ try{ let f=u; try{ new URL(f);}catch(e){ f=absolutize(f);} if(isAdHost(f)) f=patchDomainParamToUrl(new URL(f,location.href)); return _o.call(this,m,f,a!==false,s,p); }catch(e){ return _o.apply(this,arguments);} }; }catch(e){}",
      "  try{ Object.defineProperty(document,'referrer',{ get:function(){ return siteUrl; }, configurable:true }); }catch(e){}",
      "  const swfBlobCache=new Map();",
      "  async function fetchArrayBuffer(url){ const r=await fetch(url); if(!r.ok) throw new Error('fetch failed'); return await r.arrayBuffer(); }",
      "  async function swfToBlobUrl(url){ if(swfBlobCache.has(url)) return swfBlobCache.get(url); try{ const ab=await fetchArrayBuffer(url); const b=URL.createObjectURL(new Blob([ab],{type:'application/x-shockwave-flash'})); swfBlobCache.set(url,b); return b; }catch(e){ return url; } }",
      "  function tryConvertExistingSwfElements(){ try{ const objs=document.getElementsByTagName('object'); for(let o of objs){ const data=o.getAttribute('data')||''; if(data.toLowerCase().endsWith('.swf')){ (async function(el,src){ const abs=absolutize(src); const b=await swfToBlobUrl(abs); el.setAttribute('data',b); for(let p of el.getElementsByTagName('param')){ if((p.getAttribute('name')||'').toLowerCase()==='movie') p.setAttribute('value',b); } })(o,data); } } const embeds=document.getElementsByTagName('embed'); for(let e of embeds){ const src=e.getAttribute('src')||e.src||''; if(src.toLowerCase().endsWith('.swf')){ (async function(el,s){ const abs=absolutize(s); const b=await swfToBlobUrl(abs); el.setAttribute('src',b); })(e,src); } } }catch(e){} }",
      "  setTimeout(tryConvertExistingSwfElements,10);",
      "})();"
    ];

    script.textContent = scriptLines.join("\n");
    htmlDoc.head.prepend(script);
    readyHtmlContent = htmlDoc.documentElement.outerHTML;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (gameContainer) {
      gameContainer.innerHTML = `<div style="color:red;padding:20px;">Error: ${message}</div>`;
    }
    if (playAltInlineBtn) playAltInlineBtn.disabled = true;
    if (playAltFullscreenBtn) playAltFullscreenBtn.disabled = true;
  }
}

function launchAltGame(isInline: boolean): void {
  if (!readyHtmlContent) {
    alert("Game is not ready yet. Please wait.");
    return;
  }

  const blob = new Blob([readyHtmlContent], { type: "text/html" });
  const objectUrl = URL.createObjectURL(blob);

  if (isInline && gameContainer) {
    gameContainer.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.src = objectUrl;
    iframe.allow = "fullscreen; autoplay; encrypted-media";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    gameContainer.appendChild(iframe);
    return;
  }

  const popup = window.open(objectUrl, "_blank");
  if (!popup) {
    alert("Please allow popups for this site.");
  }
}

installGameButtons();
void prepareGameContent();
