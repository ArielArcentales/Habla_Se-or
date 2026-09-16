"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./lib/supabase";

const PREGUNTAS = [
  {
    texto: "¿Quién llamó a Samuel cuando estaba a punto de dormir?",
    opciones: ["Elí", "Su mamá Ana", "Dios"],
    correcta: 2,
  },
  {
    texto: "¿Qué edad aproximada tenía Samuel cuando Dios le habló?",
    opciones: ["8 años", "10 años", "12 años"],
    correcta: 2,
  },
  {
    texto:
      "¿Quién era el mentor que le enseñó a Samuel a identificar la voz de Dios?",
    opciones: ["David", "Elí", "Naamán"],
    correcta: 1,
  },
  {
    texto: "¿Qué frase dijo la joven María al aceptar el llamado de Dios?",
    opciones: [
      "¡Habla, Señor!",
      "La batalla es del Señor",
      "Aquí está la sierva del Señor",
    ],
    correcta: 2,
  },
  {
    texto: "¿Cuál es la respuesta que TODOS debemos dar cuando Dios nos llama?",
    opciones: ["Yo iré", "Habla, Señor, porque tu siervo oye", "Aquí estoy"],
    correcta: 1,
  },
  {
    texto:
      "Según el relato (2 Crónicas 34), ¿a qué edad comenzó a reinar Josías antes de derribar los ídolos?",
    opciones: ["8 años", "15 años", "20 años"],
    correcta: 0,
  },
  {
    texto:
      "Según el libro Patriarcas y Profetas, ¿qué hacía Ana desde que Samuel dio sus primeras muestras de inteligencia?",
    opciones: [
      "Le enseñó a orar de rodillas 3 veces al día",
      "Le enseñó a considerarse a sí mismo como del Señor",
      "Le hizo prometer que nunca saldría del templo",
    ],
    correcta: 1,
  },
  {
    texto: "¿En qué año fue fundado oficialmente nuestro Club Gedeón?",
    opciones: ["2015", "[PONER_AÑO_CORRECTO]", "2010"],
    correcta: 1,
  },
  {
    texto: "¿Quiénes han sido los últimos 3 directores del Club Gedeón?",
    opciones: [
      "Dir 1, Dir 2, Dir 3",
      "[NOMBRES_CORRECTOS_AQUI]",
      "Dir 4, Dir 5, Dir 6",
    ],
    correcta: 1,
  },
  {
    texto:
      "¿Cuántos años tiene el desarrollador de esta aplicación (Dev Ariel)?",
    opciones: ["19 años", "21 años", "23 años"],
    correcta: 1,
  },
];

type Participante = {
  nombre: string;
  tiempo_ms: number;
};

// Nuevos tipos para manejar las opciones aleatorias sin perder la correcta
type OpcionJuego = {
  texto: string;
  esCorrecta: boolean;
};

type PreguntaJuego = {
  texto: string;
  opciones: OpcionJuego[];
};

export default function QuizApp() {
  const [etapa, setEtapa] = useState<
    "inicio" | "juego" | "resultado" | "directorio"
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
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  // El estado de las preguntas ahora usa nuestro nuevo tipo
  const [preguntasJuego, setPreguntasJuego] = useState<PreguntaJuego[]>([]);

  const iniciarJuego = () => {
    if (!nombre.trim()) {
      setMostrarAlerta(true);
      return;
    }

    // 1. Mapeamos y mezclamos las opciones para CADA pregunta
    const preguntasMapeadas = PREGUNTAS.map((p) => {
      const opciones = p.opciones.map((op, index) => ({
        texto: op,
        esCorrecta: index === p.correcta,
      }));

      // Mezclar las opciones
      for (let i = opciones.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opciones[i], opciones[j]] = [opciones[j], opciones[i]];
      }

      return { texto: p.texto, opciones };
    });

    // 2. Mezclamos el orden de las preguntas
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
    // Evaluamos directamente la propiedad 'esCorrecta' de la opción seleccionada
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

    // Solo hacemos el select, sin order by, para obtener todo
    const { data, error } = await supabase
      .from("participantes")
      .select("nombre, tiempo_ms");

    if (!error && data) {
      // Mezclamos los participantes aleatoriamente antes de mostrarlos
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

  return (
    <main className="min-h-[100dvh] bg-linear-to-br from-[#f6eedf] via-[#e8dcc6] to-[#92c5e9] flex flex-col relative overflow-x-hidden">
      <AnimatePresence>
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

              <button
                onClick={verDirectorio}
                className="mt-6 w-[80%] bg-[#d76118] border-4 border-[#0b1f3a] text-[#0b1f3a] font-black text-sm uppercase tracking-widest py-3 px-6 rounded-2xl shadow-[4px_4px_0px_#0b1f3a] transform rotate-2 hover:-rotate-1 transition-all active:translate-y-[2px] active:shadow-[2px_2px_0px_#0b1f3a]"
              >
                Participantes
              </button>

              <img
                src="/conquis.png"
                alt="Conquistadores"
                className="w-24 sm:w-28 mt-8 drop-shadow-xl"
              />
            </motion.div>
          )}
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
                      Cargando datos...
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

                {isSubmitting ? (
                  <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-bold animate-pulse mb-6">
                    Guardando resultado
                  </div>
                ) : (
                  <div className="inline-block px-4 py-2 bg-[#facc15] text-[#0b1f3a] border-2 border-[#0b1f3a] shadow-[2px_2px_0px_#0b1f3a] rounded-lg font-bold mb-6">
                    ¡Resultado guardado con éxito!
                  </div>
                )}
              </div>

              <button
                onClick={verDirectorio}
                className="mt-6 w-[80%] bg-[#dc2626] border-4 border-[#0b1f3a] text-[#0b1f3a] font-black text-sm uppercase tracking-widest py-3 px-6 rounded-2xl shadow-[4px_4px_0px_#0b1f3a] transform rotate-2 hover:-rotate-1 transition-all active:translate-y-[2px] active:shadow-[2px_2px_0px_#0b1f3a]"
              >
                Ver Registro en vivo
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
          © 2026 • Ariel Arcentales
        </p>
      </footer>
    </main>
  );
}
