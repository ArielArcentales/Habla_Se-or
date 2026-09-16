"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./lib/supabase";

// --- BANCO DE PREGUNTAS ---
const PREGUNTAS = [
  {
    texto:
      "¿Quién le habló a Samuel cuando era un niño y estaba acostado en el templo?",
    opciones: ["El sacerdote Elí", "Su madre Ana", "La voz de Dios"],
    correcta: 2,
  },
  {
    texto:
      "¿Quién fue el mentor que le enseñó a Samuel a reconocer que era Dios quien lo llamaba?",
    opciones: ["El profeta Natán", "El sumo sacerdote Elí", "Su padre Elcana"],
    correcta: 1,
  },
  {
    texto:
      "¿Qué respuesta exacta le indicó Elí a Samuel que debía darle a Dios la próxima vez que lo llamara?",
    opciones: [
      '"Aquí estoy, Señor, dime qué quieres"',
      '"Habla, Señor, porque tu siervo oye"',
      '"Heme aquí, envíame a mí"',
    ],
    correcta: 1,
  },
  {
    texto:
      "¿Cómo se llamaba la madre de Samuel, quien lo dedicó al servicio del templo?",
    opciones: ["Abigaíl", "Ana", "Elisabet"],
    correcta: 1,
  },
  {
    texto:
      "¿Cuál fue la actitud principal de la joven María al aceptar el llamado de Dios?",
    opciones: [
      "Miedo y duda constante",
      "Indiferencia ante el mensaje",
      "Sumisión y disposición total",
    ],
    correcta: 2,
  },
  {
    texto:
      "Según el relato de 2 Crónicas 34 (mencionado en el sermón), ¿a qué edad comenzó a reinar el rey Josías antes de buscar a Dios?",
    opciones: ["8 años", "12 años", "16 años"],
    correcta: 0,
  },
  {
    texto:
      "Según el libro Patriarcas y Profetas (citado en el sermón), ¿qué aspecto fundamental cuidaba Ana en la educación temprana de Samuel?",
    opciones: [
      "Que aprendiera a tocar el arpa perfectamente para los cultos",
      "Que se considerara a sí mismo como propiedad de Dios",
      "Que memorizara todo el Pentateuco antes de los 5 años",
    ],
    correcta: 1,
  },
  {
    texto: "¿En qué año fue fundado oficialmente nuestro Club Gedeón?",
    opciones: ["1997", "1987", "2005"],
    correcta: 1,
  },
  {
    texto:
      "¿Con cuántos hombres se quedó Gedeón para derrotar al ejército de los madianitas según la Biblia?",
    opciones: ["100 hombres", "300 hombres", "500 hombres"],
    correcta: 1,
  },
  {
    texto: "¿Cuántos años tiene el predicador (Ariel)?",
    opciones: ["20 años", "21 años", "22 años"],
    correcta: 1,
  },
];

type Participante = {
  nombre: string;
  tiempo_ms: number;
  puntaje?: number;
  creado_en?: string;
};

type OpcionJuego = {
  texto: string;
  esCorrecta: boolean;
};

type PreguntaJuego = {
  texto: string;
  opciones: OpcionJuego[];
};

// CLAVE MAESTRA PARA REVELAR GANADORES
const CLAVE_ADMIN = "GedeonDev21!";

export default function QuizApp() {
  const [etapa, setEtapa] = useState<
    "inicio" | "juego" | "resultado" | "directorio" | "podio"
  >("inicio");
  const [nombre, setNombre] = useState("");
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [puntaje, setPuntaje] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [tiempoFinal, setTiempoFinal] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [listaParticipantes, setListaParticipantes] = useState<Participante[]>(
    [],
  );
  const [cargandoDirectorio, setCargandoDirectorio] = useState(false);

  // Estados para alertas y modales
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [mostrarModalClave, setMostrarModalClave] = useState(false);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [claveIngresada, setClaveIngresada] = useState("");
  const [errorClave, setErrorClave] = useState(false);

  // Estados para el podio en vivo
  const [mensajeAnalisis, setMensajeAnalisis] = useState("");
  const [podioGanadores, setPodioGanadores] = useState<Participante[]>([]);

  const [preguntasJuego, setPreguntasJuego] = useState<PreguntaJuego[]>([]);

  const iniciarJuego = () => {
    if (!nombre.trim()) {
      setMostrarAlerta(true);
      return;
    }

    const preguntasMapeadas = PREGUNTAS.map((p) => {
      const opciones = p.opciones.map((op, index) => ({
        texto: op,
        esCorrecta: index === p.correcta,
      }));
      for (let i = opciones.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opciones[i], opciones[j]] = [opciones[j], opciones[i]];
      }
      return { texto: p.texto, opciones };
    });

    for (let i = preguntasMapeadas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [preguntasMapeadas[i], preguntasMapeadas[j]] = [
        preguntasMapeadas[j],
        preguntasMapeadas[i],
      ];
    }

    setPreguntasJuego(preguntasMapeadas);
    setPreguntaActual(0);
    setPuntaje(0);
    setStartTime(new Date().getTime());
    setEtapa("juego");
  };

  const manejarRespuesta = async (indiceSeleccionado: number) => {
    const esCorrecta =
      preguntasJuego[preguntaActual].opciones[indiceSeleccionado].esCorrecta;
    const nuevoPuntaje = esCorrecta ? puntaje + 1 : puntaje;
    setPuntaje(nuevoPuntaje);

    if (preguntaActual + 1 < preguntasJuego.length) {
      setPreguntaActual(preguntaActual + 1);
    } else {
      const endTime = new Date().getTime();
      const tiempoTotalMs = endTime - startTime;

      setTiempoFinal(tiempoTotalMs);
      setEtapa("resultado");
      setIsSubmitting(true);

      const { error } = await supabase
        .from("participantes")
        .insert([
          { nombre: nombre, puntaje: nuevoPuntaje, tiempo_ms: tiempoTotalMs },
        ]);

      if (error) console.error("Error al guardar:", error);
      setIsSubmitting(false);
    }
  };

  const verDirectorio = async () => {
    setEtapa("directorio");
    setCargandoDirectorio(true);

    const { data, error } = await supabase
      .from("participantes")
      .select("nombre, tiempo_ms");

    if (!error && data) {
      const participantesMezclados = [...data];
      for (let i = participantesMezclados.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participantesMezclados[i], participantesMezclados[j]] = [
          participantesMezclados[j],
          participantesMezclados[i],
        ];
      }
      setListaParticipantes(participantesMezclados);
    } else {
      console.error("Error al cargar el directorio", error);
    }
    setCargandoDirectorio(false);
  };

  const abrirModalPodio = () => {
    setClaveIngresada("");
    setErrorClave(false);
    setMostrarModalClave(true);
  };

  const validarClaveYRevelar = () => {
    if (claveIngresada === CLAVE_ADMIN) {
      setMostrarModalClave(false);
      revelarGanadores();
    } else {
      setErrorClave(true);
    }
  };

  const revelarGanadores = async () => {
    setEtapa("podio");
    setMensajeAnalisis("Conectando con la base de datos");

    const { data, error } = await supabase
      .from("participantes")
      .select("nombre, puntaje, tiempo_ms, creado_en");

    if (!error && data) {
      const ganadoresOrdenados = data.sort((a, b) => {
        if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
        if (a.tiempo_ms !== b.tiempo_ms) return a.tiempo_ms - b.tiempo_ms;
        return (
          new Date(a.creado_en!).getTime() - new Date(b.creado_en!).getTime()
        );
      });

      setPodioGanadores(ganadoresOrdenados.slice(0, 3));
    }

    setTimeout(() => setMensajeAnalisis("Analizando los Puntajes"), 2000);
    setTimeout(
      () => setMensajeAnalisis("Calculando tiempos de respuesta"),
      4000,
    );
    setTimeout(() => setMensajeAnalisis("Desempatando registros"), 6000);
    setTimeout(() => setMensajeAnalisis("Develando lista de jugadores"), 8000);
    setTimeout(() => setMensajeAnalisis(""), 10000);
  };

  return (
    <main className="min-h-[100dvh] bg-linear-to-br from-[#f6eedf] via-[#e8dcc6] to-[#92c5e9] flex flex-col relative overflow-x-hidden">
      {/* Botón flotante de Información (Solo en la pantalla de inicio) */}
      {etapa === "inicio" && (
        <button
          onClick={() => setMostrarInfo(true)}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 bg-white border-2 border-[#0b1f3a] text-[#0b1f3a] w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-[4px_4px_0px_#0b1f3a] transform hover:-translate-y-1 active:translate-y-[2px] active:shadow-[2px_2px_0px_#0b1f3a] transition-all"
          title="Información y Privacidad"
        >
          ℹ️
        </button>
      )}

      {/* === MODALES FLOTANTES === */}
      <AnimatePresence>
        {/* Modal: Información y Privacidad */}
        {mostrarInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1f3a]/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-[8px_8px_0px_#92c5e9] border-4 border-[#0b1f3a] relative max-h-[85vh] flex flex-col"
            >
              <h2 className="text-2xl font-black text-[#0b1f3a] uppercase tracking-tighter mb-4 text-center">
                Info y Privacidad
              </h2>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5 text-[#0b1f3a]/90 text-sm font-medium text-left">
                <div>
                  <h3 className="font-black text-base text-[#0b1f3a] uppercase mb-1">
                    ¿Cómo funciona la dinámica?
                  </h3>
                  <p>
                    El Quiz ¡Habla, Señor! es una aplicación interactiva de 10
                    preguntas diseñada para poner a prueba tu atención durante
                    el sermón del Día Mundial del Conquistador. Lee bien cada
                    pregunta y selecciona la opción que consideres correcta lo
                    más rápido posible.
                  </p>
                </div>

                <div>
                  <h3 className="font-black text-base text-[#0b1f3a] uppercase mb-1">
                    ¿Cómo se elige a los ganadores?
                  </h3>
                  <p className="mb-2">
                    El sistema calcula el podio oficial de forma automática y
                    estricta bajo los siguientes 3 criterios, en orden de
                    importancia:
                  </p>
                  <ul className="list-decimal pl-5 space-y-1">
                    <li>
                      <strong className="font-black">Puntaje total:</strong>{" "}
                      Gana quien tenga la mayor cantidad de respuestas
                      correctas.
                    </li>
                    <li>
                      <strong className="font-black">Tiempo récord:</strong> En
                      caso de empate en puntos, el sistema revisará los
                      milisegundos y dará la victoria a quien haya completado la
                      prueba en el menor tiempo.
                    </li>
                    <li>
                      <strong className="font-black">Orden de envío:</strong> Si
                      ocurre un empate exacto tanto en puntos como en
                      milisegundos, el sistema dará prioridad a la persona que
                      finalizó y envió su prueba primero.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-black text-base text-[#0b1f3a] uppercase mb-1">
                    Política de Privacidad
                  </h3>
                  <p className="mb-2">
                    Para participar, únicamente te solicitamos un nombre y
                    apellido. Esta aplicación{" "}
                    <strong className="font-black text-[#dc2626]">
                      no recopila
                    </strong>{" "}
                    correos, contraseñas, ni datos sensibles de tu dispositivo.
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong className="font-black">Uso:</strong> Tu nombre,
                      puntaje y tiempo se almacenan de forma segura de manera
                      temporal y se utilizarán{" "}
                      <strong className="font-black text-[#dc2626]">
                        exclusivamente
                      </strong>{" "}
                      para proyectar a los ganadores durante el programa de la
                      Iglesia.
                    </li>
                    <li>
                      <strong className="font-black">Protección:</strong> Ningún
                      dato será compartido con terceros, ni utilizado para fines
                      comerciales.
                    </li>
                  </ul>
                </div>

                <p className="text-center text-xs text-[#0b1f3a]/60 mt-4 italic font-bold">
                  Desarrollado con ❤️ por Ariel Arcentales para el Club Gedeón.
                </p>
              </div>

              <button
                onClick={() => setMostrarInfo(false)}
                className="w-full mt-6 py-3 bg-[#0b1f3a] text-white border-4 border-[#0b1f3a] text-lg font-black rounded-xl shadow-[4px_4px_0px_#0b1f3a] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-wider"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}

        {/* Modal: Falta de Nombre */}
        {mostrarAlerta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1f3a]/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-[8px_8px_0px_#facc15] border-4 border-[#0b1f3a] text-center relative"
            >
              <div className="text-5xl mb-4 transform -rotate-6">⚠️</div>
              <h2 className="text-2xl font-black text-[#0b1f3a] uppercase tracking-tighter mb-2">
                ¡Falta tu nombre!
              </h2>
              <p className="text-[#0b1f3a]/80 font-bold mb-6">
                Ingresa tu nombre y apellido.
              </p>
              <button
                onClick={() => setMostrarAlerta(false)}
                className="w-full py-3 bg-[#dc2626] text-[#0b1f3a] border-4 border-[#0b1f3a] text-lg font-black rounded-xl shadow-[4px_4px_0px_#0b1f3a] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-wider"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}

        {/* Modal: Clave de Administrador */}
        {mostrarModalClave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1f3a]/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-[8px_8px_0px_#4ade80] border-4 border-[#0b1f3a] text-center relative"
            >
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-2xl font-black text-[#0b1f3a] uppercase tracking-tighter mb-2">
                Acceso Restringido
              </h2>
              <p className="text-[#0b1f3a]/80 font-bold mb-6 text-sm">
                Ingresa la clave para revelar el podio oficial.
              </p>

              <input
                type="password"
                placeholder="Contraseña"
                value={claveIngresada}
                onChange={(e) => {
                  setClaveIngresada(e.target.value);
                  setErrorClave(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && validarClaveYRevelar()}
                className="w-full p-4 mb-2 rounded-xl bg-[#f6eedf] border-2 border-[#0b1f3a] text-[#0b1f3a] font-black text-center text-lg focus:outline-none focus:ring-4 focus:ring-[#4ade80]/50 transition-all tracking-widest"
              />

              <div className="h-6 mb-2 flex items-center justify-center">
                {errorClave && (
                  <p className="text-[#dc2626] font-bold text-sm animate-bounce">
                    Clave incorrecta
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setMostrarModalClave(false)}
                  className="flex-1 py-3 bg-[#e8dcc6] text-[#0b1f3a] border-2 border-[#0b1f3a] text-sm font-black rounded-xl shadow-[4px_4px_0px_#0b1f3a] hover:translate-y-[2px] transition-all uppercase"
                >
                  Cancelar
                </button>
                <button
                  onClick={validarClaveYRevelar}
                  className="flex-1 py-3 bg-[#4ade80] text-[#0b1f3a] border-2 border-[#0b1f3a] text-sm font-black rounded-xl shadow-[4px_4px_0px_#0b1f3a] hover:translate-y-[2px] transition-all uppercase"
                >
                  Ingresar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(#0b1f3a 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      ></div>

      <div className="flex-1 flex flex-col items-center justify-center w-full z-10 px-4 py-8 mt-4 sm:mt-8">
        <AnimatePresence mode="wait">
          {/* === PANTALLA DE INICIO === */}
          {etapa === "inicio" && (
            <motion.div
              key="inicio"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md flex flex-col items-center"
            >
              <div className="bg-[#facc15] border-4 border-[#0b1f3a] rounded-2xl px-6 py-2 mb-6 shadow-[4px_4px_0px_#0b1f3a] transform -rotate-2">
                <h2 className="text-2xl sm:text-3xl font-black text-[#0b1f3a] uppercase tracking-widest text-center">
                  Club Gedeón
                </h2>
              </div>

              <div className="w-full bg-white p-8 rounded-3xl shadow-[0_15px_40px_rgba(11,31,58,0.15)] border-4 border-[#0b1f3a] text-center relative z-10">
                <h1
                  className="text-4xl sm:text-5xl font-black text-[#0b1f3a] mb-2 tracking-tighter uppercase"
                  style={{ textShadow: "2px 2px 0px #facc15" }}
                >
                  ¡Habla, Señor!
                </h1>
                <p className="text-[#0b1f3a]/80 font-medium mb-6 text-base sm:text-lg mt-2">
                  Demuestra qué tan atento estuviste al sermón. ¡El más rápido y
                  preciso gana!
                </p>

                <input
                  type="text"
                  placeholder="Tu nombre y apellido"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full p-4 mb-5 rounded-xl bg-[#f6eedf] border-2 border-[#0b1f3a] text-[#0b1f3a] placeholder-[#0b1f3a]/50 font-bold text-lg focus:outline-none focus:ring-4 focus:ring-[#facc15]/50 transition-all"
                  onKeyDown={(e) => e.key === "Enter" && iniciarJuego()}
                />

                <button
                  onClick={iniciarJuego}
                  className="w-full py-4 bg-[#0b1f3a] hover:bg-[#153259] text-[#facc15] text-xl font-black rounded-xl transition-all shadow-[4px_4px_0px_#facc15] hover:shadow-[2px_2px_0px_#facc15] hover:translate-y-[2px] uppercase tracking-wide"
                >
                  Comenzar Desafío
                </button>
              </div>

              {/* Botones secundarios */}
              <div className="flex w-[80%] gap-3 mt-6">
                <button
                  onClick={verDirectorio}
                  className="flex-1 bg-[#d76118] border-4 border-[#0b1f3a] text-[#0b1f3a] font-black text-xs sm:text-sm uppercase tracking-widest py-3 px-2 rounded-2xl shadow-[4px_4px_0px_#0b1f3a] transform rotate-1 hover:-rotate-1 transition-all active:translate-y-[2px]"
                >
                  Participantes
                </button>
                <button
                  onClick={abrirModalPodio}
                  className="flex-1 bg-[#4ade80] border-4 border-[#0b1f3a] text-[#0b1f3a] font-black text-xs sm:text-sm uppercase tracking-widest py-3 px-2 rounded-2xl shadow-[4px_4px_0px_#0b1f3a] transform -rotate-1 hover:rotate-1 transition-all active:translate-y-[2px]"
                >
                  Ganadores
                </button>
              </div>

              <img
                src="/conquis.png"
                alt="Conquistadores"
                className="w-24 sm:w-28 mt-8 drop-shadow-xl"
              />
            </motion.div>
          )}

          {/* === PANTALLA DEL DIRECTORIO === */}
          {etapa === "directorio" && (
            <motion.div
              key="directorio"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md flex flex-col items-center"
            >
              <div className="w-full bg-white p-6 sm:p-8 rounded-3xl shadow-[0_15px_40px_rgba(11,31,58,0.15)] border-4 border-[#0b1f3a] max-h-[70vh] flex flex-col relative z-10">
                <h2
                  className="text-2xl sm:text-3xl font-black text-[#0b1f3a] mb-6 text-center uppercase tracking-tighter"
                  style={{ textShadow: "2px 2px 0px #facc15" }}
                >
                  Registro
                </h2>

                <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-3 custom-scrollbar">
                  {cargandoDirectorio ? (
                    <p className="text-center font-bold text-[#0b1f3a]/60 animate-pulse py-10">
                      Cargando datos
                    </p>
                  ) : listaParticipantes.length === 0 ? (
                    <p className="text-center font-bold text-[#0b1f3a]/60 py-10">
                      Aún no hay participantes.
                    </p>
                  ) : (
                    listaParticipantes.map((p, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 rounded-xl bg-[#f6eedf] border-2 border-[#0b1f3a]"
                      >
                        <span className="font-bold text-[#0b1f3a] truncate pr-4">
                          {p.nombre}
                        </span>
                        <span className="font-black text-[#dc2626] whitespace-nowrap">
                          {(p.tiempo_ms / 1000).toFixed(2)}s
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setEtapa("inicio")}
                  className="w-full py-3 bg-[#0b1f3a] hover:bg-[#153259] text-[#facc15] border-2 border-[#0b1f3a] text-lg font-black rounded-xl transition-all shadow-[4px_4px_0px_#0b1f3a] hover:translate-y-[2px] uppercase"
                >
                  Volver al Inicio
                </button>
              </div>

              <img
                src="/conquis.png"
                alt="Conquistadores"
                className="w-24 sm:w-28 mt-8 drop-shadow-xl"
              />
            </motion.div>
          )}

          {/* === PANTALLA DE PODIO (GANADORES EN VIVO) === */}
          {etapa === "podio" && (
            <motion.div
              key="podio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg flex flex-col items-center justify-center min-h-[60vh]"
            >
              {mensajeAnalisis ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="bg-white p-10 rounded-3xl border-4 border-[#0b1f3a] shadow-[10px_10px_0px_#facc15] text-center w-full max-w-md relative z-10"
                >
                  <div className="w-16 h-16 border-8 border-[#e8dcc6] border-t-[#0b1f3a] rounded-full animate-spin mx-auto mb-6"></div>
                  <h2 className="text-2xl font-black text-[#0b1f3a] uppercase tracking-wider animate-pulse">
                    {mensajeAnalisis}
                  </h2>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-white p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgba(11,31,58,0.3)] border-4 border-[#0b1f3a] text-center relative z-10"
                >
                  <h2
                    className="text-4xl font-black text-[#0b1f3a] mb-8 uppercase"
                    style={{ textShadow: "2px 2px 0px #facc15" }}
                  >
                    Podio Oficial
                  </h2>

                  <div className="flex flex-col gap-4">
                    {podioGanadores[0] && (
                      <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-[#facc15] p-5 rounded-2xl border-4 border-[#0b1f3a] shadow-[6px_6px_0px_#0b1f3a] relative overflow-hidden transform hover:-translate-y-1 transition-transform"
                      >
                        <div className="absolute -right-4 -top-4 text-6xl opacity-20">
                          👑
                        </div>
                        <div className="flex justify-between items-center relative z-10">
                          <div className="text-left">
                            <span className="text-[#0b1f3a] font-black text-sm uppercase tracking-widest">
                              1º Lugar
                            </span>
                            <h3 className="text-2xl font-black text-[#0b1f3a] uppercase">
                              {podioGanadores[0].nombre}
                            </h3>
                          </div>
                          <div className="text-right bg-white px-3 py-1 rounded-lg border-2 border-[#0b1f3a]">
                            <p className="text-[#0b1f3a] font-black text-xl">
                              {podioGanadores[0].puntaje} pts
                            </p>
                            <p className="text-[#dc2626] font-bold text-sm">
                              {(podioGanadores[0].tiempo_ms / 1000).toFixed(2)}s
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {podioGanadores[1] && (
                      <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="bg-[#e2e8f0] p-4 rounded-2xl border-4 border-[#0b1f3a] shadow-[4px_4px_0px_#0b1f3a] ml-4"
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-left">
                            <span className="text-[#0b1f3a]/60 font-black text-xs uppercase tracking-widest">
                              2º Lugar
                            </span>
                            <h3 className="text-xl font-black text-[#0b1f3a] uppercase">
                              {podioGanadores[1].nombre}
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-[#0b1f3a] font-black">
                              {podioGanadores[1].puntaje} pts
                            </p>
                            <p className="text-[#0b1f3a]/70 font-bold text-xs">
                              {(podioGanadores[1].tiempo_ms / 1000).toFixed(2)}s
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {podioGanadores[2] && (
                      <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="bg-[#d76118] p-4 rounded-2xl border-4 border-[#0b1f3a] shadow-[4px_4px_0px_#0b1f3a] ml-8"
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-left">
                            <span className="text-white/90 font-black text-xs uppercase tracking-widest">
                              3º Lugar
                            </span>
                            <h3 className="text-lg font-black text-white uppercase">
                              {podioGanadores[2].nombre}
                            </h3>
                          </div>
                          <div className="text-right text-white">
                            <p className="font-black">
                              {podioGanadores[2].puntaje} pts
                            </p>
                            <p className="font-bold text-xs text-white/90">
                              {(podioGanadores[2].tiempo_ms / 1000).toFixed(2)}s
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <button
                    onClick={() => setEtapa("inicio")}
                    className="mt-8 w-full py-3 bg-[#0b1f3a] text-white border-2 border-[#0b1f3a] text-sm font-black rounded-xl transition-all hover:bg-slate-800 uppercase tracking-widest"
                  >
                    Cerrar Podio
                  </button>
                </motion.div>
              )}

              {!mensajeAnalisis && (
                <img
                  src="/conquis.png"
                  alt="Conquistadores"
                  className="w-24 sm:w-28 mt-8 drop-shadow-xl relative z-10"
                />
              )}
            </motion.div>
          )}

          {/* === PANTALLA DE JUEGO === */}
          {etapa === "juego" && (
            <motion.div
              key="juego"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-md flex flex-col items-center"
            >
              <img
                src="/dia-mundial.png"
                alt="Día Mundial"
                className="w-20 sm:w-24 mb-6 rounded-xl shadow-md border-2 border-[#0b1f3a]"
              />

              <div className="w-full bg-white p-6 sm:p-8 rounded-3xl shadow-[0_15px_40px_rgba(11,31,58,0.15)] border-4 border-[#0b1f3a]">
                <div className="flex justify-between text-sm text-[#0b1f3a] font-black mb-3 uppercase">
                  <span>Pregunta {preguntaActual + 1}</span>
                  <span>{preguntasJuego.length}</span>
                </div>
                <div className="w-full bg-[#e8dcc6] h-3 rounded-full mb-8 border-2 border-[#0b1f3a] overflow-hidden">
                  <motion.div
                    className="bg-[#facc15] h-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((preguntaActual + 1) / preguntasJuego.length) * 100}%`,
                    }}
                  />
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-[#0b1f3a] mb-8 leading-snug">
                  {preguntasJuego[preguntaActual].texto}
                </h2>

                <div className="space-y-4">
                  {preguntasJuego[preguntaActual].opciones.map(
                    (opcion, index) => (
                      <button
                        key={index}
                        onClick={() => manejarRespuesta(index)}
                        className="w-full text-left p-4 sm:p-5 rounded-xl bg-white hover:bg-[#f6eedf] border-2 border-[#0b1f3a] text-[#0b1f3a] font-bold text-lg transition-all shadow-[4px_4px_0px_#0b1f3a] hover:shadow-[2px_2px_0px_#0b1f3a] hover:translate-y-[2px]"
                      >
                        {opcion.texto}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <img
                src="/conquis.png"
                alt="Conquistadores"
                className="w-16 sm:w-20 mt-6 drop-shadow-xl"
              />
            </motion.div>
          )}

          {/* === PANTALLA DE RESULTADOS === */}
          {etapa === "resultado" && (
            <motion.div
              key="resultado"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md flex flex-col items-center"
            >
              <div className="w-full bg-white p-8 rounded-3xl shadow-[0_15px_40px_rgba(11,31,58,0.15)] border-4 border-[#0b1f3a] text-center relative z-10">
                <h2
                  className="text-3xl font-black text-[#0b1f3a] mb-2 uppercase"
                  style={{ textShadow: "2px 2px 0px #facc15" }}
                >
                  ¡Prueba Finalizada!
                </h2>

                <p className="text-[#0b1f3a]/80 font-bold mb-2">
                  ¡Gracias por participar!
                </p>

                <div className="bg-[#0b1f3a] rounded-2xl p-6 mb-6 text-white border-b-8 border-[#153259] mt-6 relative">
                  <p className="text-[#facc15] text-sm font-bold uppercase tracking-widest mb-1">
                    Tu Puntaje
                  </p>
                  <p className="text-5xl font-black">
                    {puntaje}{" "}
                    <span className="text-2xl text-white/50">
                      / {preguntasJuego.length}
                    </span>
                  </p>

                  <div className="h-px bg-white/20 my-4" />

                  <p className="text-[#facc15] text-sm font-bold uppercase tracking-widest mb-1">
                    Tu Tiempo
                  </p>
                  <p className="text-3xl font-bold">
                    {(tiempoFinal / 1000).toFixed(2)}s
                  </p>
                </div>

                {/* Nuevo mensaje sobre la revelación en el programa JA */}
                <div className="mt-4 mb-6 p-4 bg-[#f6eedf] border-2 border-[#0b1f3a] rounded-xl shadow-[4px_4px_0px_#0b1f3a]">
                  <p className="text-[#0b1f3a] font-bold text-sm">
                    Los ganadores oficiales se revelarán durante el programa JA.
                    ¡Mantente atento!
                  </p>
                </div>

                {isSubmitting ? (
                  <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-bold animate-pulse">
                    Guardando resultado
                  </div>
                ) : (
                  <div className="inline-block px-4 py-2 bg-[#4ade80] text-[#0b1f3a] border-2 border-[#0b1f3a] shadow-[2px_2px_0px_#0b1f3a] rounded-lg font-bold">
                    ¡Resultado guardado con éxito!
                  </div>
                )}
              </div>

              {/* Botón para ver los participantes en lugar de los ganadores */}
              <button
                onClick={verDirectorio}
                className="mt-6 w-[80%] bg-[#d76118] border-4 border-[#0b1f3a] text-[#0b1f3a] font-black text-sm uppercase tracking-widest py-3 px-6 rounded-2xl shadow-[4px_4px_0px_#0b1f3a] transform rotate-2 hover:-rotate-1 transition-all active:translate-y-[2px]"
              >
                Ver Participantes
              </button>

              <img
                src="/conquis.png"
                alt="Conquistadores"
                className="w-24 sm:w-28 mt-8 drop-shadow-xl"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="w-full text-center z-10 pb-6 px-4">
        <p className="text-[#0b1f3a] font-black uppercase tracking-widest text-[11px] sm:text-xs mb-0.5">
          IASD Comité del Pueblo
        </p>
        <p className="text-[#0b1f3a]/75 font-bold text-[10px] sm:text-[11px]">
          © 2026 • Dev Ariel Arcentales
        </p>
      </footer>
    </main>
  );
}
