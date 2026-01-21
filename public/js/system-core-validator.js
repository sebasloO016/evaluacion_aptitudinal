(function () {
    // --- CONFIGURACIÓN DE SEGURIDAD (Cadenas en Base64) para cuidar datos del usuario en logeo e informacion por que estaran expuestos a internet ---

    const _p1 = "RGVzYXJyb2xsYWRvIHBvcg==";
    const _p2 = "RWRpc29uIFNlYmFzdGlhbiBHYXZpbGFuZXMgTMOzcGV6";
    const _p3 = "LiBUb2RvcyBsb3MgZGVyZWNob3MgcmVzZXJ2YWRvcy4=";
    const _numVisual = "KzU5MyAwOTg4NTE1MjI1";
    const _waLink = "aHR0cHM6Ly93YS5tZS81OTM5ODg1MTUyMjU=";
    const _id = 'sys-integrity-layer';

    function decode(str) {
        return decodeURIComponent(atob(str).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    function maintainIntegrity() {
        let layer = document.getElementById(_id);
        const year = new Date().getFullYear();

        const strName = "<strong>" + decode(_p2) + "</strong>";
        const strRights = decode(_p3);
        const strWa = ' <span style="margin: 0 8px;">|</span> <a href="' + decode(_waLink) + '" target="_blank" style="color: #64748b; text-decoration: none; font-weight: 500;">WhatsApp: ' + decode(_numVisual) + '</a>';

        const fullHTML = decode(_p1) + " " + strName + " &copy; " + year + strRights + strWa;

        if (!layer) {
            layer = document.createElement('div');
            layer.id = _id;


            // layer.style.cssText = ".... display:block !important; visibility:visible !important; opacity:1 !important;";


            layer.style.cssText = "display:none !important; visibility:hidden !important; opacity:0 !important;";

            const main = document.querySelector('main') || document.body;
            main.appendChild(layer);
        }

        // if (layer.style.display === 'none' || layer.style.visibility === 'hidden' || layer.style.opacity === '0') {
        //     layer.style.display = 'block';
        //     layer.style.visibility = 'visible';
        //     layer.style.opacity = '1';
        // }

        // ✅ Esto puedes dejarlo, porque solo actualiza el contenido interno (aunque esté oculto)
        if (layer.innerHTML !== fullHTML) {
            layer.innerHTML = fullHTML;
        }
    }

    window.addEventListener('load', maintainIntegrity);

    // (pero si quieres optimizar, puedes quitarlo también)
    setInterval(maintainIntegrity, 1500);
})();
