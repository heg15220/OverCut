# test_gpfuncs.py
from grand_prix_history_questions import GP_FUNCS

print("=== TESTEANDO GP_FUNCS ===")
for name, fn in GP_FUNCS.items():
    try:
        result = fn()
        if result is None:
            print(f"[❌] {name}: devolvió None (falta 'return L' o error en append')")
        elif not isinstance(result, list):
            print(f"[⚠️] {name}: devolvió tipo {type(result).__name__}, debería ser list")
        elif len(result) == 0:
            print(f"[⚠️] {name}: lista vacía")
        else:
            print(f"[✅] {name}: OK ({len(result)} preguntas)")
    except Exception as e:
        print(f"[💥] {name}: lanzó excepción -> {e}")
print("=== FIN DEL TEST ===")
