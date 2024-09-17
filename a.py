import pygame
import numpy as np
import time

# Inicjalizacja Pygame
pygame.mixer.pre_init(44100, -16, 1, 512)  # Ustawienia audio: 44.1kHz, 16-bit, mono, buffer
pygame.init()

# Funkcja generująca fale dźwiękowe
def generate_tone(frequency, duration, sample_rate=44100, amplitude=4096):
    t = np.linspace(0, duration, int(sample_rate * duration), False)  # Czas trwania fali
    wave = np.sin(2 * np.pi * frequency * t) * amplitude  # Generowanie fali sinusoidalnej
    sound = np.int16(wave).tobytes()  # Przekształcenie fali w format Pygame
    return sound

# Funkcja do odtwarzania dźwięków
def play_tone(frequency, duration):
    if frequency > 0:
        sound = pygame.mixer.Sound(generate_tone(frequency, duration))
        sound.play()
        time.sleep(duration)  # Odczekaj czas trwania dźwięku
        sound.stop()
    else:
        time.sleep(duration)  # Pauza, jeśli częstotliwość to 0

# Częstotliwości nut (w Hz)
frequencies = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F#4': 369.99, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
}

# Definicja nut i rytmu z obrazu
melody = [
    ('E4',0.5),('F4',0.5),("G4",0.5)
]

# Odtworzenie melodii
for note, duration in melody:
    frequency = frequencies.get(note, 0)
    play_tone(frequency, duration)

# Zakończenie
pygame.quit()
