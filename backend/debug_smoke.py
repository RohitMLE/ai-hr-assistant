import json
from scripts.phase1_smoke import main

try:
    main()
except Exception as e:
    print(e)
