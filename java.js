const elementoLibro = document.getElementById("libro");
const libro = new St.PageFlip(
    elementoLibro,
    {
        width: 400,
        height: 550,

        size: "stretch",

        minWidth: 280,
        maxWidth: 800,

        minHeight: 350,
        maxHeight: 1100,

        showCover: true,

        drawShadow: true,

        flippingTime: 1000,

        maxShadowOpacity: 0.5,

        usePortrait: true,

        mobileScrollSupport: false
    }
);

libro.loadFromHTML(
    document.querySelectorAll(".pagina")
);
const botonAnterior = document.getElementById("anterior");
const botonSiguiente = document.getElementById("siguiente");

const numeroPagina = document.getElementById("numero-pagina");

function actualizarPagina() {

    const paginaActual = libro.getCurrentPageIndex() + 1;

    numeroPagina.textContent = "Página " + paginaActual;

    botonAnterior.disabled = paginaActual === 1;

    botonSiguiente.disabled =
        paginaActual === libro.getPageCount();
}

botonSiguiente.addEventListener("click", function() {

    libro.flipNext();

});

botonAnterior.addEventListener("click", function() {

    libro.flipPrev();

});

libro.on("flip", function() {

    actualizarPagina();

});
actualizarPagina();
