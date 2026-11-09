// «Para ir más allá» de la Biblioteca (fase 14): los temas de la antigua Guía que no entran en la ruta.
// No dan puntos ni tienen ejercicios: son para cuando quieras seguir por tu cuenta.

export interface Concepto {
  id: string;
  titulo: string;
  // Cuándo te lo vas a encontrar
  cuando: string;
  texto: string[];
  codigo: string;
}

export const PARA_IR_MAS_ALLA: Concepto[] = [
  {
    id: 'excepciones',
    titulo: 'Excepciones: try y except',
    cuando: 'En cuanto tu programa lea algo que escribe una persona o que viene de fuera.',
    texto: [
      'Los errores que has visto en la ruta (ValueError, ZeroDivisionError…) son excepciones: avisos de que algo ha ido mal. Con try/except puedes capturarlas y decidir qué hacer en lugar de que el programa se pare.',
      'Captura solo los errores que esperas y sabes resolver: un except sin tipo esconde también los fallos de tu propio código.',
    ],
    codigo: `def dividir(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        print("No se puede dividir entre cero")
        return None

print(dividir(10, 2))   # 5.0
print(dividir(10, 0))   # avisa y devuelve None

try:
    edad = int("veinte")
except ValueError:
    print("Eso no es un número")
finally:
    print("Esto se ejecuta siempre")`,
  },
  {
    id: 'archivos',
    titulo: 'Archivos: leer y escribir',
    cuando: 'Para guardar datos entre una ejecución y otra, o para leer datos que no caben en el código.',
    texto: [
      'open() abre un archivo: "w" para escribir (borra lo que hubiera), "a" para añadir al final y "r" para leer. Con with, Python lo cierra solo al terminar el bloque, aunque haya un error.',
      'Recorrer el archivo con for lee una línea en cada vuelta; .strip() le quita el salto de línea del final.',
    ],
    codigo: `with open("bitacora.txt", "w", encoding="utf-8") as archivo:
    archivo.write("Día 1: despegue\\n")
    archivo.write("Día 2: órbita estable\\n")

with open("bitacora.txt", "r", encoding="utf-8") as archivo:
    for linea in archivo:
        print(linea.strip())`,
  },
  {
    id: 'modulos',
    titulo: 'Módulos: import',
    cuando: 'Desde ya: casi todo lo que necesites ya lo ha escrito alguien.',
    texto: [
      'Un módulo es un archivo de Python con funciones listas para usar. Python trae muchísimos (la biblioteca estándar): math para cuentas, random para el azar, datetime para fechas…',
      'Tus propios archivos también son módulos: si tienes naves.py, desde otro archivo puedes escribir from naves import Nave. Así se reparte un programa grande en piezas.',
    ],
    codigo: `import math
import random
from datetime import date

print(math.sqrt(16))           # 4.0
print(math.pi)                 # 3.141592653589793
print(random.randint(1, 6))    # un dado: de 1 a 6
print(date(2026, 11, 8).year)  # 2026`,
  },
  {
    id: 'generadores',
    titulo: 'Generadores: yield',
    cuando: 'Cuando trabajes con muchos datos (o infinitos) y no quieras tenerlos todos en memoria a la vez.',
    texto: [
      'Una función con yield no devuelve un resultado y termina: va entregando valores de uno en uno, cada vez que se le pide el siguiente, y recuerda por dónde iba.',
      'Se recorre con for como una lista, pero sin crear la lista entera. Por eso range(1_000_000) no ocupa casi nada.',
    ],
    codigo: `def cuenta_atras(desde):
    n = desde
    while n > 0:
        yield n
        n -= 1

for segundo in cuenta_atras(3):
    print(segundo)              # 3, 2, 1

pares = (n for n in range(10) if n % 2 == 0)
print(sum(pares))               # 20`,
  },
  {
    id: 'decoradores',
    titulo: 'Decoradores: @',
    cuando: 'Al leer código de frameworks web o de pruebas, que los usan mucho.',
    texto: [
      'Un decorador es una función que envuelve a otra para añadirle algo (medir el tiempo, comprobar permisos, repetirla…) sin tocar su código.',
      'La línea @registrar encima de def es una forma corta de escribir despegar = registrar(despegar).',
    ],
    codigo: `def registrar(funcion):
    def envoltura(*args):
        print(f"Llamando a {funcion.__name__}{args}")
        return funcion(*args)
    return envoltura

@registrar
def despegar(nave, segundos):
    return f"{nave} despega en {segundos} s"

print(despegar("Kepler", 10))`,
  },
  {
    id: 'asincrona',
    titulo: 'Programación asíncrona: async y await',
    cuando: 'En programas que esperan mucho a la red o a otros servicios, como un bot o un servidor.',
    texto: [
      'Mientras una tarea espera (una descarga, una respuesta), otra puede avanzar. Las funciones async def se pueden pausar con await, y asyncio.gather las lanza a la vez.',
      'En el ejemplo, las dos esperas se solapan: tarda 2 segundos en total, no 3.',
    ],
    codigo: `import asyncio

async def sonda(nombre, segundos):
    await asyncio.sleep(segundos)
    return f"{nombre}: datos recibidos"

async def main():
    resultados = await asyncio.gather(sonda("Sonda A", 2), sonda("Sonda B", 1))
    print(resultados)

asyncio.run(main())`,
  },
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
