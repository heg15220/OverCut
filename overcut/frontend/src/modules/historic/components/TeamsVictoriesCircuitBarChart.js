import { useDispatch, useSelector } from "react-redux";
import * as selectors from "../selectors";
import React, { useEffect } from "react";
import * as actions from "../actions";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell, Legend,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { useParams } from "react-router-dom";
import {FormattedMessage} from "react-intl";
import {Typography} from "@mui/material";

const TeamsVictoriesCircuitBarChart = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const teamsVictoriesCircuit = useSelector(selectors.getTeamsVictoriesByCircuit);
    const driversVictoriesCircuit = useSelector(selectors.getDriversVictoriesByCircuit);
    const isLoading = useSelector(state => state.isLoading);
    const circuit = useSelector(selectors.getCircuit);

    useEffect(() => {
        const circuitId = Number(id);
        if (!Number.isNaN(circuitId) && circuitId !== "undefined") {
            dispatch(actions.getTeamsVictoriesByCircuitName(circuitId, () => {}));
            dispatch(actions.fetchCircuitDetails(circuitId, () => {}));
        } else {
            console.error("ID inválido o no definido");
            // Maneja el caso en que el ID sea inválido o no definido
        }
    }, [dispatch, id]);



    useEffect(() => {
        const circuitId = Number(id);
        if (!Number.isNaN(circuitId) && circuitId !== "undefined") {
            dispatch(actions.getDriversVictoriesByCircuitName(circuitId, () => {}));
        } else {
            console.error("ID inválido o no definido");
            // Maneja el caso en que el ID sea inválido o no definido
        }
    }, [dispatch, id]);

    const colors = [
        '#FFC080', // Marrón claro
        '#786C3B', // Marrón oscuro
        '#ADD8E6', // Azul claro
        '#4169E1', // Azul oscuro
        '#FFFF00', // Amarillo claro
        '#FFD700',  // Amarillo oscuro
        '#FFA07A',  // Rojo claro
        '#8B0A1E'   // Rojo oscuro
    ];



    // Verifica si los datos están cargando o si no hay datos disponibles
    if (isLoading || !teamsVictoriesCircuit || !teamsVictoriesCircuit.items.length || !driversVictoriesCircuit || !driversVictoriesCircuit.items.length) {
        return <div>Loading...</div>; // Muestra un indicador de carga o retorna temprano
    }

    return (
        <>
            <Typography variant="body2" color="text.secondary" sx={{
                fontSize: '1.2rem', // Ajusta el tamaño de la fuente
                fontStyle: 'italic', // Aplica estilo cursiva
                fontWeight: 'bold', // Aplica negrita
                color: '#333333', // Color de texto blanco
                padding: '5px', // Espaciado interno
                borderRadius: '5px', // Bordes redondeados
                marginBottom: '10px', // Espacio debajo para separar del siguiente elemento
                maxWidth: 'auto', // Permite que el ancho se adapte al contenido
                display: 'inline-block', // Hace que el componente se ajuste al contenido
                marginX: 'auto', // Centra horizontalmente el componente
            }}>

                {circuit.name} <FormattedMessage id="project.entities.stats.circuit"></FormattedMessage>
            </Typography>
            <BarChart
                width={500}
                height={300}
                data={teamsVictoriesCircuit.items}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="teamName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="victories" fill="#8884d8">
                    {teamsVictoriesCircuit.items.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Bar>
            </BarChart>

            <BarChart
                width={1000}
                height={300}
                data={driversVictoriesCircuit.items}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pilotName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="victories" fill="#8884d8">
                    {driversVictoriesCircuit.items.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Bar>
            </BarChart>
        </>
    );
};

export default TeamsVictoriesCircuitBarChart;
