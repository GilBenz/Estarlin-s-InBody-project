const DATA_FILE_PATH = 'data.json'
const APP_STATE = {
    measurements: []
}
const ELEMENTS = {
    app: document.getElementById('app'),
    form: null,
    resultDisplay: null,
    historyList: null
}

const fetchData = async () => {
    try {
        const response = await fetch(DATA_FILE_PATH)
        if (!response.ok) throw new Error('Network response was not ok')
        const data = await response.json()
        return data.measurements || []
    } catch (error) {
        console.error('Error fetching data:', error)
        return []
    }
}

const saveData = async (data) => {
    try {
        const payload = { measurements: data }
        const response = await fetch(DATA_FILE_PATH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        return response.ok
    } catch (error) {
        console.error('Error saving data:', error)
        return false
    }
}

const calculateBMI = (weightKg, heightCm) => {
    const heightM = heightCm / 100
    if (heightM <= 0) return 0
    return weightKg / (heightM * heightM)
}

const classifyBMI = (bmi) => {
    if (bmi < 18.5) return { label: 'Bajo Peso', className: 'low' }
    if (bmi >= 18.5 && bmi < 24.9) return { label: 'Peso Normal', className: 'normal' }
    if (bmi >= 25 && bmi < 29.9) return { label: 'Sobrepeso', className: 'high' }
    return { label: 'Obesidad', className: 'vhigh' }
}

const handleSubmit = async (event) => {
    event.preventDefault()

    const heightInput = document.getElementById('height')
    const weightInput = document.getElementById('weight')
    const ageInput = document.getElementById('age')

    const height = parseFloat(heightInput.value)
    const weight = parseFloat(weightInput.value)
    const age = parseInt(ageInput.value, 10)

    if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
        renderResult('0.00', { label: 'Datos Inválidos', className: 'vhigh' })
        return
    }

    const bmi = calculateBMI(weight, height)
    const classification = classifyBMI(bmi)

    const newMeasurement = {
        id: Date.now(),
        bmi: bmi.toFixed(2),
        classification: classification.label,
        date: new Date().toISOString().split('T')[0]
    }

    APP_STATE.measurements.unshift(newMeasurement)

    const saveSuccess = await saveData(APP_STATE.measurements)
    if (saveSuccess) {
        renderResult(newMeasurement.bmi, classification)
        renderHistory()
    } else {
        alert('Error al guardar la medición')
    }
}

const renderResult = (bmi, classification) => {
    ELEMENTS.resultDisplay.innerHTML = `
        <p class="text-lg">Tu Índice de Masa Corporal (IMC) es:</p>
        <div class="result-value">${bmi}</div>
        <p class="text-lg">Clasificación de Salud:</p>
        <span class="classification ${classification.className}">${classification.label}</span>
    `
}

const renderHistory = () => {
    ELEMENTS.historyList.innerHTML = ''
    if (APP_STATE.measurements.length === 0) {
        ELEMENTS.historyList.innerHTML = '<p class="text-sm text-center text-gray-500">Aún no hay mediciones guardadas.</p>'
        return
    }

    APP_STATE.measurements.forEach(m => {
        const item = document.createElement('div')
        const classification = classifyBMI(parseFloat(m.bmi))
        item.className = 'history-item'
        item.innerHTML = `
            <span class="history-score">IMC: ${m.bmi}</span>
            <span class="classification ${classification.className}">${m.classification}</span>
            <span class="history-date">${m.date}</span>
        `
        ELEMENTS.historyList.appendChild(item)
    })
}

const createFormUI = () => {
    const formCard = document.createElement('div')
    formCard.className = 'card'
    formCard.innerHTML = `
        <h2>Calculadora de IMC</h2>
        <form id="bmi-form">
            <div>
                <label for="height">Altura (cm)</label>
                <input type="number" id="height" required min="50" max="300" placeholder="Ej: 175" step="0.1">
            </div>
            <div>
                <label for="weight">Peso (kg)</label>
                <input type="number" id="weight" required min="10" max="500" placeholder="Ej: 70.5" step="0.1">
            </div>
            <div>
                <label for="age">Edad (años)</label>
                <input type="number" id="age" required min="1" max="150" placeholder="Ej: 30" step="1">
            </div>
            <button type="submit">Calcular y Guardar</button>
        </form>
    `
    ELEMENTS.resultDisplay = document.createElement('div')
    ELEMENTS.resultDisplay.className = 'result-display'
    ELEMENTS.resultDisplay.innerHTML = `
        <p>Ingresa tus datos para empezar...</p>
    `
    formCard.appendChild(ELEMENTS.resultDisplay)
    return formCard
}

const createHistoryUI = () => {
    const historyCard = document.createElement('div')
    historyCard.className = 'card'
    historyCard.innerHTML = `
        <h2>Historial de Mediciones</h2>
    `
    ELEMENTS.historyList = document.createElement('div')
    ELEMENTS.historyList.className = 'history-list'
    historyCard.appendChild(ELEMENTS.historyList)
    return historyCard
}

const initApp = async () => {
    const mainContainer = document.createElement('div')
    mainContainer.className = 'main-container'

    mainContainer.appendChild(createFormUI())
    mainContainer.appendChild(createHistoryUI())

    ELEMENTS.app.appendChild(mainContainer)

    ELEMENTS.form = document.getElementById('bmi-form')
    if (ELEMENTS.form) {
        ELEMENTS.form.addEventListener('submit', handleSubmit)
    }

    APP_STATE.measurements = await fetchData()
    renderHistory()
}

window.onload = initApp