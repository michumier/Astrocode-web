import React, { useState } from 'react';
import './PythonGuide.css';

interface PythonGuideProps {
  onBackToDashboard?: () => void;
}

type Level = 'basico' | 'intermedio' | 'avanzado';

const PythonGuide: React.FC<PythonGuideProps> = ({ onBackToDashboard }) => {
  const [selectedLevel, setSelectedLevel] = useState<Level>('basico');

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  const handleLevelChange = (level: Level) => {
    setSelectedLevel(level);
  };

  return (
    <div className="python-guide-page">
      <div className="back-button-container">
        <button className="back-to-dashboard-btn" onClick={onBackToDashboard}>
          ← Volver al Dashboard
        </button>
      </div>
      <div className="guide-header">
        <h1>Guía Completa de Python</h1>
        <p>Aprende Python desde los conceptos básicos hasta temas avanzados</p>
      </div>

      {/* Selector de Nivel */}
      <div className="level-selector">
        <button 
          onClick={() => handleLevelChange('basico')}
          className={`level-btn ${selectedLevel === 'basico' ? 'active' : ''}`}
        >
          Básico
        </button>
        <button 
          onClick={() => handleLevelChange('intermedio')}
          className={`level-btn ${selectedLevel === 'intermedio' ? 'active' : ''}`}
        >
          Intermedio
        </button>
        <button 
          onClick={() => handleLevelChange('avanzado')}
          className={`level-btn ${selectedLevel === 'avanzado' ? 'active' : ''}`}
        >
          Avanzado
        </button>
      </div>

      <div className="guide-content">
        {/* Conceptos Básicos */}
        {selectedLevel === 'basico' && (
          <section className="guide-section">
            <h2>🐍 Conceptos Básicos</h2>
            <div className="concept-grid">
              <div className="concept-card">
                <h3>Variables y Tipos de Datos</h3>
                <div className="concept-description">
                  <p>Las variables son contenedores que almacenan datos. Python tiene diferentes tipos de datos como texto (string), números enteros (int), números decimales (float) y valores verdadero/falso (boolean).</p>
                </div>
                <div className="code-example">
                  <code>
                    {`# Variables
nombre = "Juan"
edad = 25
altura = 1.75
es_estudiante = True

# Tipos de datos
print(type(nombre))    # <class 'str'>
print(type(edad))      # <class 'int'>
print(type(altura))    # <class 'float'>
print(type(es_estudiante)) # <class 'bool'>`}
                  </code>
                </div>
              </div>

              <div className="concept-card">
                <h3>Operadores</h3>
                <div className="concept-description">
                  <p>Los operadores nos permiten realizar operaciones matemáticas y lógicas. Los operadores aritméticos básicos incluyen suma (+), resta (-), multiplicación (*), división (/), y otros más avanzados.</p>
                </div>
                <div className="code-example">
                  <code>
                    {`# Operadores aritméticos
a = 10
b = 3
print(a + b)  # 13 (suma)
print(a - b)  # 7 (resta)
print(a * b)  # 30 (multiplicación)
print(a / b)  # 3.33 (división)
print(a // b) # 3 (división entera)
print(a % b)  # 1 (módulo)
print(a ** b) # 1000 (potencia)`}
                  </code>
                </div>
              </div>

              <div className="concept-card">
                <h3>Estructuras de Control</h3>
                <div className="concept-description">
                  <p>Las estructuras de control nos permiten tomar decisiones (if/else) y repetir acciones (bucles for/while). Son fundamentales para crear programas que respondan a diferentes situaciones.</p>
                </div>
                <div className="code-example">
                  <code>
                    {`# Condicionales
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
    edad += 1`}
                  </code>
                </div>
              </div>

              <div className="concept-card">
                <h3>Listas y Diccionarios</h3>
                <div className="concept-description">
                  <p>Las listas almacenan múltiples elementos en orden, mientras que los diccionarios almacenan pares clave-valor. Son estructuras de datos esenciales para organizar información.</p>
                </div>
                <div className="code-example">
                  <code>
                    {`# Listas
frutas = ["manzana", "banana", "naranja"]
frutas.append("uva")
print(frutas[0])  # "manzana"

# Diccionarios
persona = {
    "nombre": "Ana",
    "edad": 30,
    "ciudad": "Madrid"
}
print(persona["nombre"])  # "Ana"`}
                  </code>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Conceptos Intermedios */}
        {selectedLevel === 'intermedio' && (
          <section className="guide-section">
            <h2>🚀 Conceptos Intermedios</h2>
            <div className="concept-grid">
              <div className="concept-card">
                <h3>Funciones</h3>
                <div className="concept-description">
                  <p>Las funciones son bloques de código reutilizable que realizan tareas específicas. Pueden recibir parámetros y devolver valores. Las funciones lambda son funciones pequeñas y anónimas.</p>
                </div>
                <div className="code-example">
                  <code>
                    {`def saludar(nombre, apellido=""):
    if apellido:
        return f"Hola, {nombre} {apellido}!"
    return f"Hola, {nombre}!"

# Llamadas a la función
print(saludar("Juan"))           # "Hola, Juan!"
print(saludar("Ana", "García"))  # "Hola, Ana García!"

# Función lambda
cuadrado = lambda x: x ** 2
print(cuadrado(5))  # 25`}
                  </code>
                </div>
              </div>

              <div className="concept-card">
                <h3>Clases y Objetos</h3>
                <div className="concept-description">
                  <p>La programación orientada a objetos permite crear clases (plantillas) y objetos (instancias). Las clases definen atributos y métodos que los objetos pueden usar.</p>
                </div>
                <div className="code-example">
                  <code>
                    {`class Persona:
    def __init__(self, nombre, edad):
        self.nombre = nombre
        self.edad = edad
    
    def presentarse(self):
        return f"Soy {self.nombre} y tengo {self.edad} años"

# Crear objeto
persona1 = Persona("Carlos", 25)
print(persona1.presentarse())`}
                  </code>
                </div>
              </div>

              <div className="concept-card">
                <h3>Manejo de Archivos</h3>
                <div className="concept-description">
                  <p>Python permite leer y escribir archivos de forma sencilla. El uso de 'with' garantiza que los archivos se cierren correctamente después de usarlos.</p>
                </div>
                <div className="code-example">
                  <code>
                    {`# Escribir archivo
with open("archivo.txt", "w") as archivo:
    archivo.write("Hola, mundo!")

# Leer archivo
with open("archivo.txt", "r") as archivo:
    contenido = archivo.read()
    print(contenido)

# Leer línea por línea
with open("archivo.txt", "r") as archivo:
    for linea in archivo:
        print(linea.strip())`}
                  </code>
                </div>
              </div>

              <div className="concept-card">
                <h3>Manejo de Excepciones</h3>
                <div className="concept-description">
                  <p>Las excepciones permiten manejar errores de forma elegante. Con try/except podemos capturar errores específicos y ejecutar código alternativo.</p>
                </div>
                <div className="code-example">
                  <code>
                    {`try:
    numero = int(input("Ingresa un número: "))
    resultado = 10 / numero
    print(f"Resultado: {resultado}")
except ValueError:
    print("Error: Debes ingresar un número válido")
except ZeroDivisionError:
    print("Error: No se puede dividir por cero")
finally:
    print("Operación completada")`}
                  </code>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Conceptos Avanzados */}
        {selectedLevel === 'avanzado' && (
          <section className="guide-section">
            <h2>⚡ Conceptos Avanzados</h2>
            <div className="concept-grid">
              <div className="concept-card">
                <h3>Decoradores</h3>
                <div className="concept-description">
                  <p>Los decoradores son una forma elegante de modificar o extender el comportamiento de funciones sin cambiar su código. Permiten agregar funcionalidad de manera reutilizable.</p>
                </div>
                <div className="code-example">
                  <code>
                    {`def mi_decorador(func):
    def wrapper(*args, **kwargs):
        print("Antes de ejecutar la función")
        resultado = func(*args, **kwargs)
        print("Después de ejecutar la función")
        return resultado
    return wrapper

@mi_decorador
def saludar(nombre):
    print(f"Hola, {nombre}!")

saludar("Python")  # Ejecuta con decorador`}
                  </code>
                </div>
              </div>

              <div className="concept-card">
                <h3>Generadores</h3>
                <div className="concept-description">
                  <p>Los generadores permiten crear iteradores de forma eficiente usando 'yield'. Son útiles para trabajar con grandes cantidades de datos sin cargar todo en memoria.</p>
                </div>
                <div className="code-example">
                  <code>
                    {`def contador(maximo):
    n = 0
    while n < maximo:
        yield n
        n += 1

# Usar generador
for num in contador(5):
    print(num)  # 0, 1, 2, 3, 4

# Comprensión de listas
cuadrados = [x**2 for x in range(10) if x % 2 == 0]
print(cuadrados)  # [0, 4, 16, 36, 64]`}
                  </code>
                </div>
              </div>

              <div className="concept-card">
                <h3>Módulos y Paquetes</h3>
                <div className="concept-description">
                  <p>Los módulos permiten organizar y reutilizar código. Python tiene una gran biblioteca estándar y también puedes crear tus propios módulos para estructurar mejor tus proyectos.</p>
                </div>
                <div className="code-example">
                  <code>
                    {`# Importar módulos
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
print(mi_funcion())`}
                  </code>
                </div>
              </div>

              <div className="concept-card">
                <h3>Programación Asíncrona</h3>
                <div className="concept-description">
                  <p>La programación asíncrona permite ejecutar múltiples tareas concurrentemente sin bloquear el programa. Es especialmente útil para operaciones de red y E/S.</p>
                </div>
                <div className="code-example">
                  <code>
                    {`import asyncio

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

# asyncio.run(main())`}
                  </code>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Enlaces Externos */}
      <div className="external-resources">
        <h2>📚 Recursos Adicionales</h2>
        <p>Amplía tu conocimiento con estos recursos especializados:</p>
        <div className="resource-buttons">
          <button 
            className="resource-btn"
            onClick={() => handleExternalLink('https://docs.python.org/es/3/')}
          >
            📖 Documentación Oficial
          </button>
          <button 
            className="resource-btn"
            onClick={() => handleExternalLink('https://realpython.com/')}
          >
            🎯 Real Python
          </button>
          <button 
            className="resource-btn"
            onClick={() => handleExternalLink('https://www.codecademy.com/learn/learn-python-3')}
          >
            💻 Codecademy Python
          </button>
          <button 
            className="resource-btn"
            onClick={() => handleExternalLink('https://www.python.org/dev/peps/pep-8/')}
          >
            📝 PEP 8 Style Guide
          </button>
          <button 
            className="resource-btn"
            onClick={() => handleExternalLink('https://github.com/vinta/awesome-python')}
          >
            ⭐ Awesome Python
          </button>
          <button 
            className="resource-btn"
            onClick={() => handleExternalLink('https://www.kaggle.com/learn/python')}
          >
            📊 Kaggle Learn Python
          </button>
        </div>
      </div>

      <div className="guide-footer">
        <p>¡Sigue practicando y nunca dejes de aprender! 🐍✨</p>
      </div>

      {/* Stars Background */}
      <div className="stars">
        {Array.from({ length: 100 }, (_, i) => (
          <div 
            key={i} 
            className="star" 
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default PythonGuide;