
require("dotenv").config();

const express = require("express");
const path = require("path");
const { randomUUID } = require("crypto");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const PORT = process.env.PORT || 3000;
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/+$/, "");
const MODO_MP = (process.env.MP_ENV || "pruebas").toLowerCase();

app.use(express.json());

const db = new DatabaseSync(path.join(__dirname, "cuppy-pop.db"));

const PRECIOS = {
    "Galleta": 15,
    "Cupcake de vainilla": 10,
    "Cupcake de chocolate": 10,
    "Pan": 30,
    "Croissant": 25
};

db.exec(`
    CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        telefono TEXT NOT NULL,
        direccion TEXT NOT NULL,
        indicaciones TEXT,
        productos TEXT NOT NULL,
        total REAL NOT NULL,
        metodo_pago TEXT NOT NULL,
        estado_pedido TEXT NOT NULL DEFAULT 'recibido',
        estado_pago TEXT NOT NULL DEFAULT 'pendiente',
        fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        referencia_transferencia TEXT,
        mp_payment_id TEXT,
        mp_external_reference TEXT
    );

    CREATE TABLE IF NOT EXISTS checkout_pendientes (
        referencia TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        telefono TEXT NOT NULL,
        direccion TEXT NOT NULL,
        indicaciones TEXT,
        productos TEXT NOT NULL,
        total REAL NOT NULL,
        preferencia_id TEXT,
        creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
`);

const columnas = db.prepare("PRAGMA table_info(pedidos)").all().map(c => c.name);

for (const [nombre, tipo] of [
    ["referencia_transferencia", "TEXT"],
    ["mp_payment_id", "TEXT"],
    ["mp_external_reference", "TEXT"]
]) {
    if (!columnas.includes(nombre)) {
        db.exec(`ALTER TABLE pedidos ADD COLUMN ${nombre} ${tipo}`);
    }
}

function clienteMP() {
    const token = process.env.MP_ACCESS_TOKEN;

    if (!token) {
        throw new Error("Falta MP_ACCESS_TOKEN en el archivo .env.");
    }

    

    if (MODO_MP === "produccion" && !token.startsWith("APP_USR-")) {
        throw new Error("Verifica las credenciales de producción de Mercado Pago.");
    }

    if (!["pruebas", "produccion"].includes(MODO_MP)) {
        throw new Error("MP_ENV debe ser pruebas o produccion.");
    }

    return new MercadoPagoConfig({ accessToken: token });
}

function validarProductos(items) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("El carrito está vacío.");
    }

    let total = 0;

    const lista = items.map(item => {
        const precio = PRECIOS[item.nombre];

        if (
            !precio ||
            !Number.isInteger(item.cantidad) ||
            item.cantidad < 1 ||
            item.cantidad > 50
        ) {
            throw new Error("Producto o cantidad no válidos.");
        }

        total += precio * item.cantidad;

        return {
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio
        };
    });

    return { lista, total };
}

function validarCliente({ nombre, telefono, direccion }) {
    if (
        typeof nombre !== "string" || !nombre.trim() ||
        typeof telefono !== "string" || !telefono.trim() ||
        typeof direccion !== "string" || !direccion.trim()
    ) {
        throw new Error("Completa nombre, teléfono y dirección.");
    }
}

app.get("/api/estado", (req, res) => {
    res.json({ tienda: "Cuppy pop", servidor: "funcionando" });
});

// TRANSFERENCIA BBVA: registra el pedido pendiente de revisión manual.
app.post("/api/pedidos", (req, res) => {
    try {
        const {
            nombre, telefono, direccion,
            indicaciones = "",
            productos,
            metodo_pago,
            referencia_transferencia = ""
        } = req.body;

        if (metodo_pago !== "transferencia") {
            return res.status(400).json({
                error: "Esta ruta solo registra pedidos por transferencia."
            });
        }

        validarCliente({ nombre, telefono, direccion });
        const { lista, total } = validarProductos(productos);

        const resultado = db.prepare(`
            INSERT INTO pedidos (
                nombre, telefono, direccion, indicaciones,
                productos, total, metodo_pago,
                estado_pedido, estado_pago, referencia_transferencia
            )
            VALUES (?, ?, ?, ?, ?, ?, 'transferencia',
                    'recibido', 'pendiente_revision', ?)
        `).run(
            nombre.trim(),
            telefono.trim(),
            direccion.trim(),
            String(indicaciones || ""),
            JSON.stringify(lista),
            total,
            String(referencia_transferencia || "").trim()
        );

        res.status(201).json({
            pedidoId: Number(resultado.lastInsertRowid),
            total,
            estadoPago: "pendiente_revision"
        });
    } catch (error) {
        console.error("Error en transferencia:", error.message);
        res.status(400).json({ error: error.message });
    }
});

// MERCADO PAGO: crea el checkout, pero todavía no registra una venta.
app.post("/api/crear-pago", async (req, res) => {
    let referencia;

    try {
        const {
            nombre, telefono, direccion,
            indicaciones = "", items
        } = req.body;

        validarCliente({ nombre, telefono, direccion });
        const { lista, total } = validarProductos(items);

        referencia = randomUUID();

        db.prepare(`
            INSERT INTO checkout_pendientes (
                referencia, nombre, telefono, direccion,
                indicaciones, productos, total
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            referencia,
            nombre.trim(),
            telefono.trim(),
            direccion.trim(),
            String(indicaciones || ""),
            JSON.stringify(lista),
            total
        );

        const preference = new Preference(clienteMP());

        const resultado = await preference.create({
            body: {
                items: lista.map(producto => ({
                    title: producto.nombre,
                    quantity: producto.cantidad,
                    unit_price: producto.precio,
                    currency_id: "MXN"
                })),
                external_reference: referencia,
                back_urls: {
                    success: `${APP_URL}/pago/resultado`,
                    pending: `${APP_URL}/pago/resultado`,
                    failure: `${APP_URL}/pago/resultado`
                },
                auto_return: "approved"
            }
        });

        db.prepare(`
            UPDATE checkout_pendientes
            SET preferencia_id = ?
            WHERE referencia = ?
        `).run(String(resultado.id), referencia);

        const url = resultado.init_point;

        if (!url) {
            throw new Error(
                "Mercado Pago no devolvió el enlace adecuado para este entorno. Verifica tus credenciales."
            );
        }

        res.status(201).json({ url });
    } catch (error) {
        console.error("Error al crear checkout:", error.message);

        if (referencia) {
            db.prepare(
                "DELETE FROM checkout_pendientes WHERE referencia = ?"
            ).run(referencia);
        }

        res.status(500).json({
            error: error.message || "No se pudo crear el checkout."
        });
    }
});

// Consulta el pago directamente con Mercado Pago.
async function procesarPagoVerificado(paymentId) {
    const payment = await new Payment(clienteMP()).get({ id: paymentId });

    if (payment.status !== "approved") {
        return {
            estado: payment.status || "desconocido",
            guardado: false
        };
    }

    const referencia = String(payment.external_reference || "");

    if (!referencia) {
        throw new Error("El pago no tiene referencia externa.");
    }

    const checkout = db.prepare(`
        SELECT * FROM checkout_pendientes WHERE referencia = ?
    `).get(referencia);

    if (!checkout) {
        const existente = db.prepare(`
            SELECT id FROM pedidos WHERE mp_payment_id = ?
        `).get(String(paymentId));

        if (existente) {
            return {
                estado: "approved",
                guardado: true,
                pedidoId: Number(existente.id)
            };
        }

        throw new Error("No se encontró el checkout asociado al pago.");
    }

    if (
        payment.currency_id !== "MXN" ||
        Math.abs(Number(payment.transaction_amount) - Number(checkout.total)) > 0.01
    ) {
        throw new Error("El importe o la moneda no coinciden con el pedido.");
    }

    const resultado = db.prepare(`
        INSERT INTO pedidos (
            nombre, telefono, direccion, indicaciones,
            productos, total, metodo_pago, estado_pedido,
            estado_pago, mp_payment_id, mp_external_reference
        )
        VALUES (?, ?, ?, ?, ?, ?, 'mercadopago',
                'recibido', 'aprobado', ?, ?)
    `).run(
        checkout.nombre,
        checkout.telefono,
        checkout.direccion,
        checkout.indicaciones || "",
        checkout.productos,
        checkout.total,
        String(paymentId),
        referencia
    );

    db.prepare(`
        DELETE FROM checkout_pendientes WHERE referencia = ?
    `).run(referencia);

    return {
        estado: "approved",
        guardado: true,
        pedidoId: Number(resultado.lastInsertRowid)
    };
}

app.get("/api/verificar-pago/:id", async (req, res) => {
    try {
        if (!/^\d+$/.test(req.params.id)) {
            return res.status(400).json({ error: "ID de pago no válido." });
        }

        res.json(await procesarPagoVerificado(req.params.id));
    } catch (error) {
        console.error("Error al verificar pago:", error.message);
        res.status(500).json({ error: "No se pudo verificar el pago." });
    }
});

// Resultado del checkout: regresar a la tienda no significa pago aprobado.
app.get("/pago/resultado", async (req, res) => {
    let titulo = "Pago no confirmado";
    let mensaje = "No se ha confirmado el pago. No se registró como compra completada.";

    const paymentId = req.query.payment_id || req.query.collection_id;

    if (paymentId && /^\d+$/.test(String(paymentId))) {
        try {
            const resultado = await procesarPagoVerificado(String(paymentId));

            if (resultado.estado === "approved" && resultado.guardado) {
                titulo = "¡Gracias por tu compra!";
                mensaje = `Mercado Pago confirmó tu pago. Número de pedido: ${resultado.pedidoId}.`;
            } else if (["pending", "in_process"].includes(resultado.estado)) {
                titulo = "Pago pendiente";
                mensaje = "Mercado Pago todavía no confirma el pago.";
            }
        } catch (error) {
            console.error("Error al regresar del pago:", error.message);
        }
    } else if (req.query.status === "pending" || req.query.collection_status === "pending") {
        titulo = "Pago pendiente";
        mensaje = "El pago todavía no ha sido confirmado.";
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Confirmación | Cuppy pop</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #fff1f5;
                    color: #593b32;
                    text-align: center;
                    padding: 40px 20px;
                }
                .tarjeta {
                    background: #fffaf7;
                    max-width: 500px;
                    margin: auto;
                    padding: 35px;
                    border-radius: 20px;
                    box-shadow: 0 4px 18px #00000015;
                }
                h1 { color: #b85c78; }
                a {
                    display: inline-block;
                    margin-top: 20px;
                    padding: 12px 22px;
                    background: #b85c78;
                    color: white;
                    text-decoration: none;
                    border-radius: 10px;
                }
            </style>
        </head>
        <body>
            <div class="tarjeta">
                <h1>${titulo}</h1>
                <p>${mensaje}</p>
                <p>Cuppy pop · Un pop de dulzura ♡</p>
                <a href="/">Volver a la tienda</a>
            </div>
        </body>
        </html>
    `);
});

// Panel de administración: consultar pedidos.
app.get("/api/pedidos", (req, res) => {
    try {
        const pedidos = db.prepare(`
            SELECT id, nombre, telefono, direccion, indicaciones,
                   productos, total, metodo_pago, estado_pedido,
                   estado_pago, fecha, referencia_transferencia
            FROM pedidos
            ORDER BY id DESC
        `).all();

        res.json({ pedidos });
    } catch (error) {
        console.error("Error al consultar pedidos:", error.message);
        res.status(500).json({ error: "No se pudieron consultar los pedidos." });
    }
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Cuppy pop está funcionando en http://localhost:${PORT}`);
});
