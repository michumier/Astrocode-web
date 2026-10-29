// Contenido de la guía de Python (sacado de la vista en la fase 6.5).

export interface Concepto {
  id: string;
  titulo: string;
  texto: string[];
  codigo: string;
}

export interface NivelGuia {
  id: string;
  nombre: string;
  titulo: string;
  conceptos: Concepto[];
}

export const NIVELES_GUIA: NivelGuia[] = [
  { id: 'basico', nombre: 'Básico', titulo: 'Conceptos básicos', conceptos: [
    {
      id: "variables-y-tipos-de-datos",
      titulo: "Variables y tipos de datos",
      texto: ["Las variables son contenedores que almacenan datos. Python tiene diferentes tipos de datos como texto (string), números enteros (int), números decimales (float) y valores verdadero/falso (boolean)."],
      codigo: `# Variables
nombre = "Juan"
edad = 25
altura = 1.75
es_estudiante = True

# Tipos de datos
print(type(nombre))    # <class 'str'>
print(type(edad))      # <class 'int'>
print(type(altura))    # <class 'float'>
print(type(es_estudiante)) # <class 'bool'>`,
    },
    {
      id: "operadores",
      titulo: "Operadores",
      texto: ["Los operadores nos permiten realizar operaciones matemáticas y lógicas. Los operadores aritméticos básicos incluyen suma (+), resta (-), multiplicación (*), división (/), y otros más avanzados."],
      codigo: `# Operadores aritméticos
a = 10
b = 3
print(a + b)  # 13 (suma)
print(a - b)  # 7 (resta)
print(a * b)  # 30 (multiplicación)
print(a / b)  # 3.33 (división)
print(a // b) # 3 (división entera)
print(a % b)  # 1 (módulo)
print(a ** b) # 1000 (potencia)`,
    },
    {
      id: "estructuras-de-control",
      titulo: "Estructuras de control",
      texto: ["Las estructuras de control nos permiten tomar decisiones (if/else) y repetir acciones (bucles for/while). Son fundamentales para crear programas que respondan a diferentes situaciones."],
      codigo: `# Condicionales
edad = 18
if edad >= 18:
    print("Eres mayor de edad")
else:
    print("Eres menor de edad")

# Bucles
for i in range(5):
    print(f"Número: {i}")

while edad < 21:
    print(f"Edad: {edad}")
    edad += 1`,
    },
    {
      id: "listas-y-diccionarios",
      titulo: "Listas y diccionarios",
      texto: ["Las listas almacenan múltiples elementos en orden, mientras que los diccionarios almacenan pares clave-valor. Son estructuras de datos esenciales para organizar información."],
      codigo: `# Listas
frutas = ["manzana", "banana", "naranja"]
frutas.append("uva")
print(frutas[0])  # "manzana"

# Diccionarios
persona = {
    "nombre": "Ana",
    "edad": 30,
    "ciudad": "Madrid"
}
print(persona["nombre"])  # "Ana"`,
    },
  ] },
  { id: 'intermedio', nombre: 'Intermedio', titulo: 'Conceptos intermedios', conceptos: [
    {
      id: "funciones",
      titulo: "Funciones",
      texto: ["Las funciones son bloques de código reutilizable que realizan tareas específicas. Pueden recibir parámetros y devolver valores. Las funciones lambda son funciones pequeñas y anónimas."],
      codigo: `def saludar(nombre, apellido=""):
    if apellido:
        return f"Hola, {nombre} {apellido}!"
    return f"Hola, {nombre}!"

# Llamadas a la función
print(saludar("Juan"))           # "Hola, Juan!"
print(saludar("Ana", "García"))  # "Hola, Ana García!"

# Función lambda
cuadrado = lambda x: x ** 2
print(cuadrado(5))  # 25`,
    },
    {
      id: "clases-y-objetos",
      titulo: "Clases y objetos",
      texto: ["La programación orientada a objetos permite crear clases (plantillas) y objetos (instancias). Las clases definen atributos y métodos que los objetos pueden usar."],
      codigo: `class Persona:
    def __init__(self, nombre, edad):
        self.nombre = nombre
        self.edad = edad
    
    def presentarse(self):
        return f"Soy {self.nombre} y tengo {self.edad} años"

# Crear objeto
persona1 = Persona("Carlos", 25)
print(persona1.presentarse())`,
    },
    {
      id: "manejo-de-archivos",
      titulo: "Manejo de archivos",
      texto: ["Python permite leer y escribir archivos de forma sencilla. El uso de 'with' garantiza que los archivos se cierren correctamente después de usarlos."],
      codigo: `# Escribir archivo
with open("archivo.txt", "w") as archivo:
    archivo.write("Hola, mundo!")

# Leer archivo
with open("archivo.txt", "r") as archivo:
    contenido = archivo.read()
    print(contenido)

# Leer línea por línea
with open("archivo.txt", "r") as archivo:
    for linea in archivo:
        print(linea.strip())`,
    },
    {
      id: "manejo-de-excepciones",
      titulo: "Manejo de excepciones",
      texto: ["Las excepciones permiten manejar errores de forma elegante. Con try/except podemos capturar errores específicos y ejecutar código alternativo."],
      codigo: `try:
    numero = int(input("Ingresa un número: "))
    resultado = 10 / numero
    print(f"Resultado: {resultado}")
except ValueError:
    print("Error: Debes ingresar un número válido")
except ZeroDivisionError:
    print("Error: No se puede dividir por cero")
finally:
    print("Operación completada")`,
    },
  ] },
  { id: 'avanzado', nombre: 'Avanzado', titulo: 'Conceptos avanzados', conceptos: [
    {
      id: "decoradores",
      titulo: "Decoradores",
      texto: ["Los decoradores son una forma elegante de modificar o extender el comportamiento de funciones sin cambiar su código. Permiten agregar funcionalidad de manera reutilizable."],
      codigo: `def mi_decorador(func):
    def wrapper(*args, **kwargs):
        print("Antes de ejecutar la función")
        resultado = func(*args, **kwargs)
        print("Después de ejecutar la función")
        return resultado
    return wrapper

@mi_decorador
def saludar(nombre):
    print(f"Hola, {nombre}!")

saludar("Python")  # Ejecuta con decorador`,
    },
    {
      id: "generadores",
      titulo: "Generadores",
      texto: ["Los generadores permiten crear iteradores de forma eficiente usando 'yield'. Son útiles para trabajar con grandes cantidades de datos sin cargar todo en memoria."],
      codigo: `def contador(maximo):
    n = 0
    while n < maximo:
        yield n
        n += 1

# Usar generador
for num in contador(5):
    print(num)  # 0, 1, 2, 3, 4

# Comprensión de listas
cuadrados = [x**2 for x in range(10) if x % 2 == 0]
print(cuadrados)  # [0, 4, 16, 36, 64]`,
    },
    {
      id: "modulos-y-paquetes",
      titulo: "Módulos y paquetes",
      texto: ["Los módulos permiten organizar y reutilizar código. Python tiene una gran biblioteca estándar y también puedes crear tus propios módulos para estructurar mejor tus proyectos."],
      codigo: `# Importar módulos
import math
from datetime import datetime
import requests as req

# Usar funciones del módulo
print(math.sqrt(16))  # 4.0
print(datetime.now())

# Crear tu propio módulo
# archivo: mi_modulo.py
def mi_funcion():
    return "Hola desde mi módulo"

# En otro archivo
from mi_modulo import mi_funcion
print(mi_funcion())`,
    },
    {
      id: "programacion-asincrona",
      titulo: "Programación asíncrona",
      texto: ["La programación asíncrona permite ejecutar múltiples tareas concurrentemente sin bloquear el programa. Es especialmente útil para operaciones de red y E/S."],
      codigo: `import asyncio

async def tarea_asincrona(nombre, tiempo):
    print(f"Iniciando {nombre}")
    await asyncio.sleep(tiempo)
    print(f"Completando {nombre}")
    return f"Resultado de {nombre}"

async def main():
    # Ejecutar tareas concurrentemente
    tareas = [
        tarea_asincrona("Tarea 1", 2),
        tarea_asincrona("Tarea 2", 1)
    ]
    resultados = await asyncio.gather(*tareas)
    print(resultados)

# asyncio.run(main())`,
    },
  ] },
];

export interface Recurso {
  nombre: string;
  descripcion: string;
  url: string;
}

export const RECURSOS: Recurso[] = [
  { nombre: 'Documentación oficial', descripcion: 'La referencia de Python, en español', url: 'https://docs.python.org/es/3/' },
  { nombre: 'Real Python', descripcion: 'Tutoriales largos y bien explicados (en inglés)', url: 'https://realpython.com/' },
  { nombre: 'Codecademy', descripcion: 'Curso interactivo de Python 3', url: 'https://www.codecademy.com/learn/learn-python-3' },
  { nombre: 'PEP 8', descripcion: 'La guía de estilo para escribir Python limpio', url: 'https://peps.python.org/pep-0008/' },
  { nombre: 'Awesome Python', descripcion: 'Lista de librerías y herramientas', url: 'https://github.com/vinta/awesome-python' },
  { nombre: 'Kaggle Learn', descripcion: 'Python aplicado a datos, en lecciones cortas', url: 'https://www.kaggle.com/learn/python' },
];
