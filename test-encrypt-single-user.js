/**
 * Script de PRUEBA para encriptar UN SOLO usuario
 * 
 * INSTRUCCIONES:
 * 1. Asegúrate de tener ENCRYPTION_KEY en tu .env
 * 2. Cambia el USER_ID_TO_TEST por el ID del usuario que quieres probar
 * 3. Ejecuta: node test-encrypt-single-user.js
 */

const db = require("./util/database");
const { encrypt, decrypt, isEncrypted } = require("./util/encryption");

// 🎯 CAMBIA ESTE ID POR EL USUARIO QUE QUIERES PROBAR
const USER_ID_TO_TEST = 191;

async function testEncryptSingleUser() {
    console.log("🧪 Iniciando prueba de encriptación...\n");
    console.log(`🎯 Usuario objetivo: ID = ${USER_ID_TO_TEST}\n`);

    try {
        // 1. Obtener el usuario ANTES de encriptar
        console.log("📋 PASO 1: Obteniendo datos originales...");
        const [usersBefore] = await db.execute(
            "SELECT IDUser, name, email, gender, dateOfBirth FROM user WHERE IDUser = ?",
            [USER_ID_TO_TEST]
        );

        if (usersBefore.length === 0) {
            console.error(`❌ No se encontró el usuario con ID ${USER_ID_TO_TEST}`);
            process.exit(1);
        }

        const userBefore = usersBefore[0];
        
        console.log("📊 Datos ANTES de encriptar:");
        console.log("─".repeat(50));
        console.log(`  ID: ${userBefore.IDUser}`);
        console.log(`  Name: ${userBefore.name}`);
        console.log(`  Email: ${userBefore.email}`);
        console.log(`  Gender: ${userBefore.gender}`);
        console.log(`  Date of Birth: ${userBefore.dateOfBirth}`);
        console.log("─".repeat(50));

        // 2. Verificar si ya está encriptado
        console.log("\n🔍 PASO 2: Verificando estado de encriptación...");
        const nameEncrypted = isEncrypted(userBefore.name);
        const emailEncrypted = isEncrypted(userBefore.email);
        const genderEncrypted = isEncrypted(userBefore.gender);
        const dateEncrypted = isEncrypted(userBefore.dateOfBirth);

        console.log(`  Name encriptado: ${nameEncrypted ? '✅ SÍ' : '❌ NO'}`);
        console.log(`  Email encriptado: ${emailEncrypted ? '✅ SÍ' : '❌ NO'}`);
        console.log(`  Gender encriptado: ${genderEncrypted ? '✅ SÍ' : '❌ NO'}`);
        console.log(`  Date encriptado: ${dateEncrypted ? '✅ SÍ' : '❌ NO'}`);

        if (nameEncrypted && emailEncrypted && genderEncrypted && dateEncrypted) {
            console.log("\n⚠️  Este usuario YA está completamente encriptado.");
            console.log("💡 Mostrando datos desencriptados:");
            console.log("─".repeat(50));
            console.log(`  Name: ${decrypt(userBefore.name)}`);
            console.log(`  Email: ${decrypt(userBefore.email)}`);
            console.log(`  Gender: ${decrypt(userBefore.gender)}`);
            console.log(`  Date of Birth: ${decrypt(userBefore.dateOfBirth)}`);
            console.log("─".repeat(50));
            await db.end();
            process.exit(0);
        }

        // 3. Encriptar los datos
        console.log("\n🔐 PASO 3: Encriptando datos...");
        const encryptedName = nameEncrypted ? userBefore.name : encrypt(userBefore.name);
        const encryptedEmail = emailEncrypted ? userBefore.email : encrypt(userBefore.email?.toLowerCase());
        const encryptedGender = genderEncrypted ? userBefore.gender : encrypt(userBefore.gender);
        const encryptedDateOfBirth = dateEncrypted ? userBefore.dateOfBirth : encrypt(userBefore.dateOfBirth);

        console.log("✅ Datos encriptados generados");

        // 4. Actualizar en la base de datos
        console.log("\n💾 PASO 4: Guardando en la base de datos...");
        const [result] = await db.execute(
            `UPDATE user 
             SET name = ?, email = ?, gender = ?, dateOfBirth = ? 
             WHERE IDUser = ?`,
            [encryptedName, encryptedEmail, encryptedGender, encryptedDateOfBirth, USER_ID_TO_TEST]
        );

        if (result.affectedRows === 0) {
            console.error("❌ No se pudo actualizar el usuario");
            process.exit(1);
        }

        console.log("✅ Usuario actualizado en la BD");

        // 5. Verificar que se guardó correctamente
        console.log("\n🔍 PASO 5: Verificando datos encriptados en BD...");
        const [usersAfter] = await db.execute(
            "SELECT IDUser, name, email, gender, dateOfBirth FROM user WHERE IDUser = ?",
            [USER_ID_TO_TEST]
        );

        const userAfter = usersAfter[0];

        console.log("📊 Datos ENCRIPTADOS en la BD:");
        console.log("─".repeat(50));
        console.log(`  Name: ${userAfter.name.substring(0, 40)}...`);
        console.log(`  Email: ${userAfter.email.substring(0, 40)}...`);
        console.log(`  Gender: ${userAfter.gender}`);
        console.log(`  Date: ${userAfter.dateOfBirth}`);
        console.log("─".repeat(50));

        // 6. Desencriptar y mostrar
        console.log("\n🔓 PASO 6: Desencriptando para verificar...");
        console.log("📊 Datos DESENCRIPTADOS:");
        console.log("─".repeat(50));
        console.log(`  Name: ${decrypt(userAfter.name)}`);
        console.log(`  Email: ${decrypt(userAfter.email)}`);
        console.log(`  Gender: ${decrypt(userAfter.gender)}`);
        console.log(`  Date of Birth: ${decrypt(userAfter.dateOfBirth)}`);
        console.log("─".repeat(50));

        // 7. Comparar valores originales con desencriptados
        console.log("\n✅ PASO 7: Comparando datos originales vs desencriptados...");
        const nameMatch = userBefore.name === decrypt(userAfter.name);
        const emailMatch = userBefore.email.toLowerCase() === decrypt(userAfter.email);
        const genderMatch = userBefore.gender === decrypt(userAfter.gender);
        const dateMatch = String(userBefore.dateOfBirth) === String(decrypt(userAfter.dateOfBirth));

        console.log(`  Name coincide: ${nameMatch ? '✅' : '❌'}`);
        console.log(`  Email coincide: ${emailMatch ? '✅' : '❌'}`);
        console.log(`  Gender coincide: ${genderMatch ? '✅' : '❌'}`);
        console.log(`  Date coincide: ${dateMatch ? '✅' : '❌'}`);

        if (nameMatch && emailMatch && genderMatch && dateMatch) {
            console.log("\n" + "=".repeat(50));
            console.log("🎉 ¡PRUEBA EXITOSA!");
            console.log("=".repeat(50));
            console.log("✅ El usuario se encriptó correctamente");
            console.log("✅ Los datos se pueden desencriptar correctamente");
            console.log("✅ Los valores originales coinciden con los desencriptados");
            console.log("\n💡 Ahora puedes ejecutar el script completo para todos los usuarios");
        } else {
            console.log("\n⚠️  Hay diferencias en los datos. Revisa la configuración.");
        }

    } catch (error) {
        console.error("\n💥 Error durante la prueba:", error);
        console.error(error.stack);
        process.exit(1);
    } finally {
        console.log("\n🔚 Cerrando conexión a la base de datos...");
        await db.end();
        process.exit(0);
    }
}

// Ejecutar la prueba
testEncryptSingleUser();