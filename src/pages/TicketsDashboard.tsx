
import { useEffect, useMemo, useState } from "react"
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart,
    Line,
} from "recharts"

import {
    Ticket,
    CheckCircle2,
    Clock3,
    XCircle,
    AlertCircle,
    RefreshCw,
    TrendingUp,
    Activity,
} from "lucide-react"

import Select from "react-select"
import api from "../services/api"


// ============================================================
// TIPOS
// ============================================================

interface SelectOption {
    value: number
    label: string
}

interface DashboardResumen {
    total: number
    abiertos: number
    solucionados: number
    sin_solucion: number
    cancelados: number
    tiempo_promedio_resolucion: number
}

interface EstadoData {
    id: number
    estado: string
    cantidad: number
}

interface EmpresaData {
    id: number
    empresa: string
    cantidad: number
}

interface ProyectoData {
    id: number
    proyecto: string
    cantidad: number
}

interface TipoData {
    id: number
    tipo: string
    cantidad: number
}

interface FallaData {
    id: number
    falla: string
    cantidad: number
}

interface CausaData {
    id: number
    causa: string
    cantidad: number
}

interface SolucionData {
    id: number
    solucion: string
    cantidad: number
}

interface EvolucionData {
    periodo: string
    cantidad: number
}

interface AntiguedadData {
    [key: string]: number
}

interface DashboardData {
    resumen: DashboardResumen
    por_estado: EstadoData[]
    por_empresa: EmpresaData[]
    por_proyecto: ProyectoData[]
    por_tipo: TipoData[]
    por_falla: FallaData[]
    por_causa: CausaData[]
    por_solucion: SolucionData[]
    evolucion: EvolucionData[]
    antiguedad_abiertos: AntiguedadData
}


// ============================================================
// COMPONENTE CARD
// ============================================================

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ReactNode
    iconClass: string
}

function StatCard({
    title,
    value,
    subtitle,
    icon,
    iconClass,
}: StatCardProps) {

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">

            <div className="flex items-start justify-between">

                <div>

                    <p className="text-sm font-medium text-gray-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {value}
                    </p>

                    {subtitle && (
                        <p className="mt-1 text-xs text-gray-500">
                            {subtitle}
                        </p>
                    )}

                </div>

                <div
                    className={`h-11 w-11 rounded-lg flex items-center justify-center ${iconClass}`}
                >
                    {icon}
                </div>

            </div>

        </div>
    )
}


// ============================================================
// CARD DE GRÁFICO
// ============================================================

interface ChartCardProps {
    title: string
    subtitle?: string
    children: React.ReactNode
    className?: string
}

function ChartCard({
    title,
    subtitle,
    children,
    className = "",
}: ChartCardProps) {

    return (
        <div
            className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${className}`}
        >

            <div className="mb-4">

                <h3 className="text-base font-semibold text-gray-900">
                    {title}
                </h3>

                {subtitle && (
                    <p className="text-xs text-gray-500 mt-1">
                        {subtitle}
                    </p>
                )}

            </div>

            {children}

        </div>
    )
}


// ============================================================
// UTILIDADES
// ============================================================

function formatearHoras(horas: number): string {

    if (!horas || horas <= 0) {
        return "0h"
    }

    const dias = Math.floor(horas / 24)
    const horasRestantes = Math.round(horas % 24)

    if (dias > 0) {
        return `${dias}d ${horasRestantes}h`
    }

    return `${horasRestantes}h`
}


function formatearPeriodo(periodo: string): string {

    if (periodo.length === 7) {

        const [year, month] = periodo.split("-")

        const fecha = new Date(
            Number(year),
            Number(month) - 1,
            1
        )

        return fecha.toLocaleDateString(
            "es-CO",
            {
                month: "short",
            }
        )
    }

    return periodo.substring(8, 10)
}


// ============================================================
// COLORES ESTADOS
// ============================================================

const STATUS_COLORS: Record<string, string> = {

    "Abierto": "#2563eb",

    "Cerrado - Solucionado": "#16a34a",

    "Cerrado - Sin solucion": "#dc2626",

    "Cancelado": "#111827",
}


// ============================================================
// DASHBOARD
// ============================================================

export default function TicketsDashboard() {

    // ========================================================
    // FILTROS
    // ========================================================

    const [empresas, setEmpresas] = useState<SelectOption[]>([])
    const [proyectos, setProyectos] = useState<SelectOption[]>([])
    const [tipos, setTipos] = useState<SelectOption[]>([])
    const [estados, setEstados] = useState<SelectOption[]>([])

    const [empresa, setEmpresa] =
        useState<SelectOption | null>(null)

    const [proyecto, setProyecto] =
        useState<SelectOption | null>(null)

    const [estado, setEstado] =
        useState<SelectOption | null>(null)

    const [tipo, setTipo] =
        useState<SelectOption | null>(null)

    const [periodo, setPeriodo] = useState<SelectOption>({
        value: 2,
        label: "Año actual",
    })


    // ========================================================
    // DASHBOARD
    // ========================================================

    const [dashboard, setDashboard] =
        useState<DashboardData | null>(null)

    const [loading, setLoading] =
        useState(false)

    const [error, setError] =
        useState<string | null>(null)


    // ========================================================
    // OPCIONES DE PERÍODO
    // ========================================================

    const periodos: SelectOption[] = [

        {
            value: 1,
            label: "Mes actual",
        },

        {
            value: 2,
            label: "Año actual",
        },

        {
            value: 3,
            label: "Todos",
        },
    ]


    // ========================================================
    // CARGAR FILTROS
    // ========================================================

    useEffect(() => {

        cargarFiltros()

    }, [])


    async function cargarFiltros() {

        try {

            const [
                empresasRes,
                proyectosRes,
                estadosRes,
                tiposRes,
            ] = await Promise.all([

                api.get("/empresa_listar_activos"),

                api.get("/proyecto_listar_activos"),

                api.get("/estado_listar_activos"),

                api.get("/tipo_listar_activos"),
            ])


            setEmpresas([
                {
                    value: 0,
                    label: "Todas",
                },
                ...empresasRes.data.map((item: any) => ({
                    value: item.id,
                    label: item.empresa,
                })),
            ])


            setProyectos([
                {
                    value: 0,
                    label: "Todos",
                },
                ...proyectosRes.data.map((item: any) => ({
                    value: item.id,
                    label: item.proyecto,
                })),
            ])


            setEstados([
                {
                    value: 0,
                    label: "Todos",
                },
                ...estadosRes.data.map((item: any) => ({
                    value: item.id,
                    label: item.estado,
                })),
            ])


            setTipos([
                {
                    value: 0,
                    label: "Todos",
                },
                ...tiposRes.data.map((item: any) => ({
                    value: item.id,
                    label: item.tipo,
                })),
            ])


            setEmpresa({
                value: 0,
                label: "Todas",
            })

            setProyecto({
                value: 0,
                label: "Todos",
            })

            setEstado({
                value: 0,
                label: "Todos",
            })

            setTipo({
                value: 0,
                label: "Todos",
            })

        } catch (err) {

            console.error(err)

            setError(
                "No fue posible cargar los filtros."
            )
        }
    }


    // ========================================================
    // CARGAR DASHBOARD
    // ========================================================

    async function cargarDashboard() {

        setLoading(true)
        setError(null)

        try {

            const params: Record<string, any> = {

                periodo:
                    periodo.value === 1
                        ? "mes"
                        : periodo.value === 2
                            ? "ano"
                            : "todos",
            }


            if (
                empresa &&
                empresa.value !== 0
            ) {
                params.empresa_id =
                    empresa.value
            }


            if (
                proyecto &&
                proyecto.value !== 0
            ) {
                params.proyecto_id =
                    proyecto.value
            }


            if (
                estado &&
                estado.value !== 0
            ) {
                params.estado_id =
                    estado.value
            }


            if (
                tipo &&
                tipo.value !== 0
            ) {
                params.tipo_id =
                    tipo.value
            }


            const response =
                await api.get(
                    "/ticket_dashboard",
                    {
                        params,
                    }
                )


            setDashboard(response.data)

        } catch (err) {

            console.error(err)

            setError(
                "No fue posible cargar el dashboard."
            )

        } finally {

            setLoading(false)
        }
    }


    // ========================================================
    // ACTUALIZAR AL CAMBIAR FILTROS
    // ========================================================

    useEffect(() => {

        if (
            empresa &&
            proyecto &&
            estado &&
            tipo
        ) {
            cargarDashboard()
        }

    }, [
        empresa,
        proyecto,
        estado,
        tipo,
        periodo,
    ])


    // ========================================================
    // DATOS DE GRÁFICOS
    // ========================================================

    const estadoChart = useMemo(() => {

        if (!dashboard) {
            return []
        }

        return dashboard.por_estado.map(
            item => ({
                name: item.estado,
                value: item.cantidad,
            })
        )

    }, [dashboard])


    const antiguedadChart = useMemo(() => {

        if (!dashboard) {
            return []
        }

        return [

            {
                name: "0 - 1 día",
                cantidad:
                    dashboard.antiguedad_abiertos["0_1_dia"] || 0,
            },

            {
                name: "2 - 3 días",
                cantidad:
                    dashboard.antiguedad_abiertos["2_3_dias"] || 0,
            },

            {
                name: "4 - 7 días",
                cantidad:
                    dashboard.antiguedad_abiertos["4_7_dias"] || 0,
            },

            {
                name: "8 - 15 días",
                cantidad:
                    dashboard.antiguedad_abiertos["8_15_dias"] || 0,
            },

            {
                name: "+15 días",
                cantidad:
                    dashboard.antiguedad_abiertos["mas_15_dias"] || 0,
            },
        ]

    }, [dashboard])


    // ========================================================
    // TOP 10
    // ========================================================

    const topFallas =
        dashboard?.por_falla.slice(0, 10) || []

    const topCausas =
        dashboard?.por_causa.slice(0, 10) || []

    const topSoluciones =
        dashboard?.por_solucion.slice(0, 10) || []


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="min-h-screen bg-gray-50 p-6">

            {/* =================================================
                ENCABEZADO
            ================================================= */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

                <div>

                    <div className="flex items-center gap-3">

                        <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">

                            <Activity
                                size={22}
                                className="text-white"
                            />

                        </div>

                        <div>

                            <h1 className="text-2xl font-bold text-gray-900">
                                Dashboard de Tickets
                            </h1>

                            <p className="text-sm text-gray-500">
                                Resumen y estadísticas de soporte
                            </p>

                        </div>

                    </div>

                </div>


                <button
                    onClick={cargarDashboard}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >

                    <RefreshCw
                        size={16}
                        className={
                            loading
                                ? "animate-spin"
                                : ""
                        }
                    />

                    Actualizar

                </button>

            </div>


            {/* =================================================
                FILTROS
            ================================================= */}

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">

                <div className="flex items-center gap-2 mb-4">

                    <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">

                        <TrendingUp
                            size={17}
                            className="text-gray-600"
                        />

                    </div>

                    <div>

                        <h2 className="text-sm font-semibold text-gray-900">
                            Filtros
                        </h2>

                        <p className="text-xs text-gray-500">
                            Seleccione los criterios para analizar los tickets
                        </p>

                    </div>

                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                    <div>

                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Empresa
                        </label>

                        <Select
                            options={empresas}
                            value={empresa}
                            onChange={setEmpresa}
                            placeholder="Todas"
                            isSearchable
                        />

                    </div>


                    <div>

                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Proyecto
                        </label>

                        <Select
                            options={proyectos}
                            value={proyecto}
                            onChange={setProyecto}
                            placeholder="Todos"
                            isSearchable
                        />

                    </div>


                    <div>

                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Estado
                        </label>

                        <Select
                            options={estados}
                            value={estado}
                            onChange={setEstado}
                            placeholder="Todos"
                            isSearchable
                        />

                    </div>


                    <div>

                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Tipo
                        </label>

                        <Select
                            options={tipos}
                            value={tipo}
                            onChange={setTipo}
                            placeholder="Todos"
                            isSearchable
                        />

                    </div>


                    <div>

                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Período
                        </label>

                        <Select
                            options={periodos}
                            value={periodo}
                            onChange={option => {

                                if (option) {
                                    setPeriodo(option)
                                }

                            }}
                            isSearchable={false}
                        />

                    </div>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {error}
                </div>

            )}


            {/* =================================================
                LOADING
            ================================================= */}

            {loading && !dashboard && (

                <div className="flex items-center justify-center py-20">

                    <RefreshCw
                        size={30}
                        className="animate-spin text-blue-600"
                    />

                </div>

            )}


            {/* =================================================
                DASHBOARD
            ================================================= */}

            {dashboard && (

                <>

                    {/* =========================================
                        KPIs
                    ========================================= */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">

                        <StatCard
                            title="Total tickets"
                            value={
                                dashboard.resumen.total
                            }
                            subtitle="Según filtros"
                            icon={
                                <Ticket
                                    size={21}
                                    className="text-blue-600"
                                />
                            }
                            iconClass="bg-blue-50"
                        />


                        <StatCard
                            title="Abiertos"
                            value={
                                dashboard.resumen.abiertos
                            }
                            subtitle="Pendientes de atención"
                            icon={
                                <AlertCircle
                                    size={21}
                                    className="text-blue-600"
                                />
                            }
                            iconClass="bg-blue-50"
                        />


                        <StatCard
                            title="Solucionados"
                            value={
                                dashboard.resumen.solucionados
                            }
                            subtitle="Cerrados correctamente"
                            icon={
                                <CheckCircle2
                                    size={21}
                                    className="text-green-600"
                                />
                            }
                            iconClass="bg-green-50"
                        />


                        <StatCard
                            title="Sin solución"
                            value={
                                dashboard.resumen.sin_solucion
                            }
                            subtitle="Cerrados sin solución"
                            icon={
                                <XCircle
                                    size={21}
                                    className="text-red-600"
                                />
                            }
                            iconClass="bg-red-50"
                        />


                        <StatCard
                            title="Cancelados"
                            value={
                                dashboard.resumen.cancelados
                            }
                            subtitle="Tickets cancelados"
                            icon={
                                <XCircle
                                    size={21}
                                    className="text-gray-700"
                                />
                            }
                            iconClass="bg-gray-100"
                        />


                        <StatCard
                            title="Tiempo promedio"
                            value={
                                formatearHoras(
                                    dashboard
                                        .resumen
                                        .tiempo_promedio_resolucion
                                )
                            }
                            subtitle="Tickets solucionados"
                            icon={
                                <Clock3
                                    size={21}
                                    className="text-purple-600"
                                />
                            }
                            iconClass="bg-purple-50"
                        />

                    </div>


                    {/* =========================================
                        ESTADO + EVOLUCIÓN
                    ========================================= */}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">


                        {/* ESTADOS */}

                        <ChartCard
                            title="Tickets por estado"
                            subtitle="Distribución actual"
                        >

                            <div className="h-[300px]">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <PieChart>

                                        <Pie
                                            data={estadoChart}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={105}
                                            paddingAngle={2}
                                        >

                                            {estadoChart.map(
                                                (entry, index) => (

                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            STATUS_COLORS[
                                                                entry.name
                                                            ] || "#64748b"
                                                        }
                                                    />

                                                )
                                            )}

                                        </Pie>

                                        <Tooltip />

                                        <Legend />

                                    </PieChart>

                                </ResponsiveContainer>

                            </div>

                        </ChartCard>


                        {/* EVOLUCIÓN */}

                        <ChartCard
                            title="Evolución de tickets"
                            subtitle={
                                periodo.value === 1
                                    ? "Tickets por día"
                                    : "Tickets por mes"
                            }
                            className="lg:col-span-2"
                        >

                            <div className="h-[300px]">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <LineChart
                                        data={
                                            dashboard.evolucion.map(
                                                item => ({
                                                    ...item,
                                                    periodo:
                                                        formatearPeriodo(
                                                            item.periodo
                                                        ),
                                                })
                                            )
                                        }
                                    >

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                        />

                                        <XAxis
                                            dataKey="periodo"
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                        />

                                        <Tooltip />

                                        <Line
                                            type="monotone"
                                            dataKey="cantidad"
                                            stroke="#2563eb"
                                            strokeWidth={3}
                                            dot={{
                                                r: 3,
                                            }}
                                            activeDot={{
                                                r: 6,
                                            }}
                                        />

                                    </LineChart>

                                </ResponsiveContainer>

                            </div>

                        </ChartCard>

                    </div>


                    {/* =========================================
                        EMPRESA + TIPO
                    ========================================= */}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">


                        <ChartCard
                            title="Tickets por empresa"
                            subtitle="Distribución según los filtros"
                        >

                            <div className="h-[350px]">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <BarChart
                                        data={
                                            dashboard.por_empresa
                                                .slice(0, 10)
                                                .map(item => ({
                                                    name:
                                                        item.empresa,
                                                    cantidad:
                                                        item.cantidad,
                                                }))
                                        }
                                        layout="vertical"
                                        margin={{
                                            left: 20,
                                            right: 20,
                                        }}
                                    >

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                        />

                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                        />

                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={120}
                                        />

                                        <Tooltip />

                                        <Bar
                                            dataKey="cantidad"
                                            fill="#2563eb"
                                            radius={[
                                                0,
                                                5,
                                                5,
                                                0,
                                            ]}
                                        />

                                    </BarChart>

                                </ResponsiveContainer>

                            </div>

                        </ChartCard>


                        <ChartCard
                            title="Tickets por tipo"
                            subtitle="Principales tipos de ticket"
                        >

                            <div className="h-[350px]">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <BarChart
                                        data={
                                            dashboard.por_tipo
                                                .slice(0, 10)
                                                .map(item => ({
                                                    name:
                                                        item.tipo,
                                                    cantidad:
                                                        item.cantidad,
                                                }))
                                        }
                                    >

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                        />

                                        <XAxis
                                            dataKey="name"
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                        />

                                        <Tooltip />

                                        <Bar
                                            dataKey="cantidad"
                                            fill="#7c3aed"
                                            radius={[
                                                5,
                                                5,
                                                0,
                                                0,
                                            ]}
                                        />

                                    </BarChart>

                                </ResponsiveContainer>

                            </div>

                        </ChartCard>

                    </div>


                    {/* =========================================
                        ANTIGÜEDAD
                    ========================================= */}

                    <div className="mb-6">

                        <ChartCard
                            title="Antigüedad de tickets abiertos"
                            subtitle="Identificación de tickets pendientes con mayor antigüedad"
                        >

                            <div className="h-[300px]">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <BarChart
                                        data={antiguedadChart}
                                    >

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                        />

                                        <XAxis
                                            dataKey="name"
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                        />

                                        <Tooltip />

                                        <Bar
                                            dataKey="cantidad"
                                            fill="#f59e0b"
                                            radius={[
                                                5,
                                                5,
                                                0,
                                                0,
                                            ]}
                                        />

                                    </BarChart>

                                </ResponsiveContainer>

                            </div>

                        </ChartCard>

                    </div>


                    {/* =========================================
                        FALLAS / CAUSAS / SOLUCIONES
                    ========================================= */}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">


                        {/* FALLAS */}

                        <ChartCard
                            title="Fallas reportadas"
                            subtitle="Top 10"
                        >

                            <div className="space-y-3">

                                {topFallas.map(
                                    (item, index) => (

                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3"
                                        >

                                            <span className="w-5 text-xs text-gray-400">
                                                {index + 1}
                                            </span>

                                            <div className="flex-1 min-w-0">

                                                <div className="flex justify-between gap-2 mb-1">

                                                    <span className="text-sm text-gray-700 truncate">
                                                        {item.falla}
                                                    </span>

                                                    <span className="text-xs font-semibold text-gray-600">
                                                        {item.cantidad}
                                                    </span>

                                                </div>

                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">

                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{
                                                            width: `${
                                                                dashboard
                                                                    .resumen
                                                                    .total > 0
                                                                    ? (
                                                                        item.cantidad /
                                                                        dashboard.resumen.total
                                                                    ) *
                                                                    100
                                                                    : 0
                                                            }%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        </ChartCard>


                        {/* CAUSAS */}

                        <ChartCard
                            title="Causas identificadas"
                            subtitle="Top 10"
                        >

                            <div className="space-y-3">

                                {topCausas.map(
                                    (item, index) => (

                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3"
                                        >

                                            <span className="w-5 text-xs text-gray-400">
                                                {index + 1}
                                            </span>

                                            <div className="flex-1 min-w-0">

                                                <div className="flex justify-between gap-2 mb-1">

                                                    <span className="text-sm text-gray-700 truncate">
                                                        {item.causa}
                                                    </span>

                                                    <span className="text-xs font-semibold text-gray-600">
                                                        {item.cantidad}
                                                    </span>

                                                </div>

                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">

                                                    <div
                                                        className="h-full bg-orange-500 rounded-full"
                                                        style={{
                                                            width: `${
                                                                dashboard
                                                                    .resumen
                                                                    .total > 0
                                                                    ? (
                                                                        item.cantidad /
                                                                        dashboard.resumen.total
                                                                    ) *
                                                                    100
                                                                    : 0
                                                            }%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        </ChartCard>


                        {/* SOLUCIONES */}

                        <ChartCard
                            title="Soluciones aplicadas"
                            subtitle="Top 10"
                        >

                            <div className="space-y-3">

                                {topSoluciones.map(
                                    (item, index) => (

                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3"
                                        >

                                            <span className="w-5 text-xs text-gray-400">
                                                {index + 1}
                                            </span>

                                            <div className="flex-1 min-w-0">

                                                <div className="flex justify-between gap-2 mb-1">

                                                    <span className="text-sm text-gray-700 truncate">
                                                        {item.solucion}
                                                    </span>

                                                    <span className="text-xs font-semibold text-gray-600">
                                                        {item.cantidad}
                                                    </span>

                                                </div>

                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">

                                                    <div
                                                        className="h-full bg-green-500 rounded-full"
                                                        style={{
                                                            width: `${
                                                                dashboard
                                                                    .resumen
                                                                    .total > 0
                                                                    ? (
                                                                        item.cantidad /
                                                                        dashboard.resumen.total
                                                                    ) *
                                                                    100
                                                                    : 0
                                                            }%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        </ChartCard>

                    </div>


                    {/* =========================================
                        PROYECTOS
                    ========================================= */}

                    <ChartCard
                        title="Tickets por proyecto"
                        subtitle="Principales proyectos"
                        className="mb-6"
                    >

                        <div className="overflow-x-auto">

                            <table className="w-full">

                                <thead>

                                    <tr className="border-b border-gray-200">

                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                            Proyecto
                                        </th>

                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                            Tickets
                                        </th>

                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                            %
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {dashboard.por_proyecto
                                        .slice(0, 10)
                                        .map(item => (

                                            <tr
                                                key={item.id}
                                                className="border-b border-gray-100 hover:bg-gray-50"
                                            >

                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {item.proyecto}
                                                </td>

                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                                                    {item.cantidad}
                                                </td>

                                                <td className="px-4 py-3 text-sm text-gray-500 text-right">

                                                    {
                                                        dashboard.resumen.total > 0
                                                            ? (
                                                                (
                                                                    item.cantidad /
                                                                    dashboard.resumen.total
                                                                ) *
                                                                100
                                                            ).toFixed(1)
                                                            : "0.0"
                                                    }%

                                                </td>

                                            </tr>

                                        ))}

                                </tbody>

                            </table>

                        </div>

                    </ChartCard>


                </>

            )}

        </div>
    )
}
