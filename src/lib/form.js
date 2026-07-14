import {writable,get} from "svelte/store"
import {$} from "./db"
export const resultados = $("",[])

export async function enviarDatos(search) {
        try {
            console.log("Enviando datos al servidor...")
            let respuesta = await fetch("/YTpro", {
                method: 'POST',
                body: search,
              
            });
            let data = await respuesta.json();
            resultados.set(data.respuesta)
            console.log("Respuesta del servidor:", get(resultados) );
        } catch (error) {
            console.error("Error al hacer fetch:", error);
        }
    }