const bcrypt = require("bcrypt");

(async () => {
    const clave = "root";
    const hash = await bcrypt.hash(clave, 10);
    console.log("CLAVE:", clave);
    console.log("HASH :", hash);
})();
