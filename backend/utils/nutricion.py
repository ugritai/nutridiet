from datetime import date

def calcular_edad(fecha_nacimiento: date) -> int:
    today = date.today()
    return today.year - fecha_nacimiento.year - (
        (today.month, today.day) < (fecha_nacimiento.month, fecha_nacimiento.day)
    )

def calcular_tmb(genero: str, peso: float, altura: float, fecha_nacimiento: date) -> float:
    edad = calcular_edad(fecha_nacimiento)
    if genero.lower() == 'masculino':
        return (10 * peso) + (6.25 * altura) - (5 * edad) + 5
    elif genero.lower() == 'femenino':
        return (10 * peso) + (6.25 * altura) - (5 * edad) - 161
    else:
        return (10 * peso) + (6.25 * altura) - (5 * edad) - 78

def calcular_kcal(tmb: float, actividad: float) -> float:
    factores = [1.2, 1.375, 1.55, 1.725, 1.9]
    return tmb * factores[min(int(actividad)-1, 4)]

def calcular_pro(genero: str, peso: float, actividad: float) -> float:
    tabla = {
        "masculino": [1.0, 1.2, 1.5, 1.8, 2.2],
        "femenino":  [0.8, 1.0, 1.2, 1.5, 1.8],
        "otro":      [0.9, 1.1, 1.4, 1.7, 2.0]
    }
    key = genero.lower() if genero.lower() in tabla else "otro"
    return peso * tabla[key][min(int(actividad)-1, 4)]

def calcular_car(genero: str, peso: float, actividad: float) -> float:
    tabla = {
        "masculino": [3.5, 4.5, 5.5, 6.5, 7.5],
        "femenino":  [3.25, 4.0, 5.0, 6.0, 7.0],
        "otro":      [3.375, 4.25, 5.25, 6.25, 7.25]
    }
    key = genero.lower() if genero.lower() in tabla else "otro"
    return peso * tabla[key][min(int(actividad)-1, 4)]
