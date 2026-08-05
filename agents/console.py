from agent import agent

print("=== Agency Custom ===")
print("Escribe instrucciones. Ctrl+C para salir.\n")

while True:
    user_input = input("> ")
    response = agent.run(user_input)
    print("\n" + str(response) + "\n")
