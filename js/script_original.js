// ================================
// CAMBIO DE APARTADOS
// ================================

function mostrarSeccion(seccion) {
 const secciones = document.querySelectorAll("main > section");

    secciones.forEach(function(elemento) {
        elemento.style.display = "none";
    });

    const seleccionada = document.getElementById(seccion);

    if (seleccionada) {
        seleccionada.style.display = "block";
    }
}

function mostrarCategoria(categoria) {

    const categorias = document.getElementById("categorias-productos");
    const detalle = document.getElementById("detalle-productos");
    const titulo = document.getElementById("titulo-categoria");
    const lista = document.getElementById("lista-productos");

    categorias.style.display = "none";
    detalle.style.display = "block";

    lista.innerHTML = "";

    if (categoria === "galletas") {

        titulo.textContent = "🍪 Galletas";

        lista.innerHTML = `
            <div class="producto">
                <div class="producto-imagen">
                    <img src="img/galletaproductos.png" alt="Galleta">
                </div>

                <h3>Galleta</h3>

                <p>Galleta casera y deliciosa.</p>

                <strong>$15</strong>

                <button onclick="agregarAlCarrito('Galleta', 15)">
                    Agregar al carrito 🛒
                </button>
            </div>
        `;

    } else if (categoria === "cupcakes") {

        titulo.textContent = "🧁 Cupcakes";

        lista.innerHTML = `
            <div class="producto">
                <div class="producto-imagen">
                    <img src="img/cupcakevainilla.png" alt="Cupcake de vainilla">
                </div>

                <h3>Cupcake de vainilla</h3>

                <p>Suave y delicioso cupcake de vainilla.</p>

                <strong>$10</strong>

                <button onclick="agregarAlCarrito('Cupcake de vainilla', 10)">
                    Agregar al carrito 🛒
                </button>
            </div>


            <div class="producto">
                <div class="producto-imagen">
                    <img src="img/cupcakechocolate.png" alt="Cupcake de chocolate">
                </div>

                <h3>Cupcake de chocolate</h3>

                <p>Delicioso cupcake de chocolate.</p>

                <strong>$10</strong>

                <button onclick="agregarAlCarrito('Cupcake de chocolate', 10)">
                    Agregar al carrito 🛒
                </button>
            </div>
        `;

    } else if (categoria === "pan") {

        titulo.textContent = "🍞 Pan";

        lista.innerHTML = `
            <div class="producto">
                <div class="producto-imagen">
                    <img src="img/panproductos.png" alt="Pan">
                </div>

                <h3>Pan</h3>

                <p>Pan dulce recién preparado.</p>

                <strong>$30</strong>

                <button onclick="agregarAlCarrito('Pan', 30)">
                    Agregar al carrito 🛒
                </button>
            </div>
        `;

    } else if (categoria === "croissant") {

        titulo.textContent = "🥐 Croissant";

        lista.innerHTML = `
            <div class="producto">
                <div class="producto-imagen">
                    <img src="img/croissantproductos.png" alt="Croissant">
                </div>

                <h3>Croissant</h3>

                <p>Suave y delicioso croissant.</p>

                <strong>$25</strong>

                <button onclick="agregarAlCarrito('Croissant', 25)">
                    Agregar al carrito 🛒
                </button>
            </div>
        `;
    }
}


function volverCategorias() {

    document.getElementById("detalle-productos").style.display = "none";

    document.getElementById("categorias-productos").style.display = "grid";
}

   


// ================================
// CARRUSEL
// ================================

const imagenes = [
    "img/cupcakeschocolate.png",
    "img/pan.png",
    "img/galletita.png",
    "img/croissantt.png",
    "img/cupcakes.png"
];

let imagenActual = 0;


function mostrarImagen(numero) {

    imagenActual = numero;

    const imagen = document.getElementById("imagenCarrusel");

    imagen.src = imagenes[imagenActual];

    actualizarIndicadores();
}


function cambiarImagen(direccion) {

    imagenActual = imagenActual + direccion;

    if (imagenActual >= imagenes.length) {
        imagenActual = 0;
    }

    if (imagenActual < 0) {
        imagenActual = imagenes.length - 1;
    }

    mostrarImagen(imagenActual);
}


function actualizarIndicadores() {

    const puntos = document.querySelectorAll(".punto");

    puntos.forEach(function(punto, indice) {

        punto.classList.remove("activo");

        if (indice === imagenActual) {
            punto.classList.add("activo");
        }

    });
}


// Cambio automático cada 4 segundos

setInterval(function() {
    cambiarImagen(1);
}, 4000);


// Mostrar Inicio al abrir la página

mostrarSeccion("inicio");




// ================================
// CARRITO DE COMPRAS
// ================================

let carrito = [];

function agregarAlCarrito(nombre, precio) {

    const productoExistente = carrito.find(function(producto) {
        return producto.nombre === nombre;
    });

    if (productoExistente) {

        productoExistente.cantidad++;

    } else {

        carrito.push({
            nombre: nombre,
            precio: precio,
            cantidad: 1
        });

    }

    actualizarCarrito();
}

function actualizarCarrito() {

    const contador = document.getElementById("contador-carrito");
    const productos = document.getElementById("carrito-productos");
    const totalElemento = document.getElementById("carrito-total");

    productos.innerHTML = "";

    if (carrito.length === 0) {

        contador.textContent = "0";
        productos.innerHTML = "<p>Tu carrito está vacío.</p>";
        totalElemento.textContent = "0";

        return;
    }

    let total = 0;
    let cantidadTotal = 0;

    carrito.forEach(function(producto, indice) {

        const subtotal = producto.precio * producto.cantidad;

        total = total + subtotal;
        cantidadTotal = cantidadTotal + producto.cantidad;

        const elemento = document.createElement("div");

        elemento.className = "producto-carrito";

        elemento.innerHTML = `
            <strong>${producto.nombre}</strong>
            <span>$${producto.precio} c/u</span>

            <div class="cantidad-carrito">
                <button onclick="cambiarCantidad(${indice}, -1)">−</button>
                <span>${producto.cantidad}</span>
                <button onclick="cambiarCantidad(${indice}, 1)">+</button>
            </div>

            <p>Subtotal: $${subtotal}</p>
<button onclick="eliminarProducto(${indice})">
    🗑️ Eliminar
</button>
        `;

        productos.appendChild(elemento);
    });

    contador.textContent = cantidadTotal;
    totalElemento.textContent = total;
}


function cambiarCantidad(indice, cambio) {

    carrito[indice].cantidad = carrito[indice].cantidad + cambio;

    if (carrito[indice].cantidad <= 0) {

        carrito.splice(indice, 1);
    }

    actualizarCarrito();
}


function eliminarProducto(indice) {

    carrito.splice(indice, 1);

    actualizarCarrito();
}



function mostrarCarrito() {

    const panel = document.getElementById("carrito-panel");
    const fondo = document.getElementById("fondo-carrito");

    if (panel.style.display === "block") {

        cerrarCarrito();

    } else {

        panel.style.display = "block";
        fondo.style.display = "block";

        document.body.style.overflow = "hidden";
    }
}


function cerrarCarrito() {

    const panel = document.getElementById("carrito-panel");
    const fondo = document.getElementById("fondo-carrito");
    const pedido = document.getElementById("pedido-panel");

    panel.style.display = "none";
    fondo.style.display = "none";
    pedido.style.display = "none";

    document.body.style.overflow = "";
}
function mostrarPedido() {

    const pedido = document.getElementById("pedido-panel");
    const resumen = document.getElementById("resumen-pedido");

    resumen.innerHTML = "";

    if (carrito.length === 0) {

        resumen.innerHTML = "<p>No tienes productos en tu carrito.</p>";

        pedido.style.display = "block";

        return;
    }

    let total = 0;

    carrito.forEach(function(producto) {

        const subtotal = producto.precio * producto.cantidad;

        total = total + subtotal;

        const elemento = document.createElement("div");

        elemento.innerHTML = `
            <p>
                <strong>${producto.nombre}</strong><br>
                Cantidad: ${producto.cantidad}<br>
                Subtotal: $${subtotal}
            </p>
        `;

        resumen.appendChild(elemento);
    });

    const totalElemento = document.createElement("p");

    totalElemento.innerHTML = `
        <strong>Total: $${total}</strong>
    `;

    resumen.appendChild(totalElemento);

    pedido.style.display = "block";
}


function cerrarPedido() {

    const pedido = document.getElementById("pedido-panel");

    pedido.style.display = "none";
}
// ================================
// CONFIRMAR PEDIDO
// ================================


async function confirmarPedido() {
    const nombre = document.getElementById("nombre-pedido").value.trim();
    const telefono = document.getElementById("telefono-pedido").value.trim();
    const direccion = document.getElementById("direccion-pedido").value.trim();
    const indicaciones = document.getElementById("mensaje-pedido").value.trim();

    if (!nombre || !telefono || !direccion) {
        alert("⚠️ Por favor, completa tu nombre, teléfono y dirección.");
        return;
    }

    if (carrito.length === 0) {
        alert("⚠️ Tu carrito está vacío.");
        return;
    }

    const boton = document.querySelector(
        'button[onclick="confirmarPedido()"]'
    );

    try {
        if (boton) boton.disabled = true;

        const respuesta = await fetch("/api/pedidos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombre,
                telefono,
                direccion,
                indicaciones,
                productos: carrito.map(producto => ({
                    nombre: producto.nombre,
                    cantidad: producto.cantidad,
                    precio: producto.precio
                })),
                metodo_pago: "Por confirmar"
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.error || "No se pudo guardar el pedido.");
        }

alert("💗 ¡Pedido recibido! Tu número de pedido es: " + datos.pedidoId);
        carrito = [];
        actualizarCarrito();
        cerrarCarrito();

        document.getElementById("nombre-pedido").value = "";
        document.getElementById("telefono-pedido").value = "";
        document.getElementById("direccion-pedido").value = "";
        document.getElementById("mensaje-pedido").value = "";

    } catch (error) {
        alert("No se pudo registrar el pedido. " + error.message);
    } finally {
        if (boton) boton.disabled = false;
    }
}



function enviarMensaje() {

    const nombre = document.getElementById("nombre-contacto").value;
    const correo = document.getElementById("correo-contacto").value;
    const mensaje = document.getElementById("mensaje-contacto").value;

    if (nombre === "" || correo === "" || mensaje === "") {

        alert("⚠️ Por favor, completa todos los campos.");

        return;
    }

    alert("💗 ¡Gracias por escribirnos! Hemos recibido tu mensaje.");

    document.getElementById("nombre-contacto").value = "";
    document.getElementById("correo-contacto").value = "";
    document.getElementById("mensaje-contacto").value = "";
}




function mostrarCategoria(categoria) {

    const categorias = document.getElementById("categorias-productos");
    const detalle = document.getElementById("detalle-productos");
    const titulo = document.getElementById("titulo-categoria");
    const lista = document.getElementById("lista-productos");

    categorias.style.display = "none";
    detalle.style.display = "block";

    lista.innerHTML = "";

    if (categoria === "galletas") {

        titulo.textContent = "🍪 Galletas";

        lista.innerHTML = `
            <div class="producto">

                <div class="producto-imagen">
                    <img src="img/galletaproductos.png" alt="Galleta">
                </div>

                <h3>Galleta</h3>

                <p>Galleta casera y deliciosa.</p>

                <strong>$15</strong>

                <button onclick="agregarAlCarrito('Galleta', 15)">
                    Agregar al carrito 🛒
                </button>

            </div>
        `;

    } else if (categoria === "cupcakes") {

        titulo.textContent = "🧁 Cupcakes";

        lista.innerHTML = `
            <div class="producto">

                <div class="producto-imagen">
                    <img src="img/cupcakevainilla.png" alt="Cupcake de vainilla">
                </div>

                <h3>Cupcake de vainilla</h3>

                <p>Suave y delicioso cupcake de vainilla.</p>

                <strong>$10</strong>

                <button onclick="agregarAlCarrito('Cupcake de vainilla', 10)">
                    Agregar al carrito 🛒
                </button>

            </div>

            <div class="producto">

                <div class="producto-imagen">
                    <img src="img/cupcakechocolate.png" alt="Cupcake de chocolate">
                </div>

                <h3>Cupcake de chocolate</h3>

                <p>Delicioso cupcake de chocolate.</p>

                <strong>$10</strong>

                <button onclick="agregarAlCarrito('Cupcake de chocolate', 10)">
                    Agregar al carrito 🛒
                </button>

            </div>
        `;

    } else if (categoria === "pan") {

        titulo.textContent = "🍞 Pan";

        lista.innerHTML = `
            <div class="producto">

                <div class="producto-imagen">
                    <img src="img/panproductos.png" alt="Pan">
                </div>

                <h3>Pan</h3>

                <p>Pan dulce recién preparado.</p>

                <strong>$30</strong>

                <button onclick="agregarAlCarrito('Pan', 30)">
                    Agregar al carrito 🛒
                </button>

            </div>
        `;

    } else if (categoria === "croissant") {

        titulo.textContent = "🥐 Croissant";

        lista.innerHTML = `
            <div class="producto">

                <div class="producto-imagen">
                    <img src="img/croissantproductos.png" alt="Croissant">
                </div>

                <h3>Croissant</h3>

                <p>Suave y delicioso croissant.</p>

                <strong>$25</strong>

                <button onclick="agregarAlCarrito('Croissant', 25)">
                    Agregar al carrito 🛒
                </button>

            </div>
        `;
    }
}


function volverCategorias() {

    document.getElementById("detalle-productos").style.display = "none";

    document.getElementById("categorias-productos").style.display = "grid";
}




async function pagarConMercadoPago() {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    try {
        const respuesta = await fetch("/api/crear-pago", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                items: carrito.map(producto => ({
                    nombre: producto.nombre,
                    cantidad: producto.cantidad
                }))
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.url) {
            throw new Error(datos.error || "No se pudo crear el pago.");
        }

        window.location.href = datos.url;

    } catch (error) {
        alert("No se pudo conectar con Mercado Pago. " + error.message);
    }
}
