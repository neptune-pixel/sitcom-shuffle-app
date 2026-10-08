import urllib.request
import re

show_ids = [
    'eb66748d-f7f2-458a-aa7b-488e2fb8bef1', '4800b25d-ef44-4a25-86e5-4a71a8e23958', '967196a8-b7a7-47aa-94a3-d6fab9df7a3e', '86bc816f-97a7-4cd6-8d53-08d5e6337063', 'a4d15a65-9071-43b9-abd8-ad905928743a', '3235a74a-6fad-4a3a-875d-ef16b1be82e8', 'ab553cdc-e15d-4597-b65f-bec9201fd2dd', '920dc342-cb8a-4c38-a0a5-04ee899dd238', '2262487a-fc52-4543-901d-c07d92ad8844', 'c775cd23-a526-4c5f-a34c-30e831edf6e4', '57660b16-a32a-476f-89da-3302ac379e91', '18ad0649-f2dd-410d-8842-2ba2aa486fdb', '28cb33be-0a53-4604-a4eb-0562593798aa', '26657073-264a-4f77-842e-378d11b2775e', '1ce7cec4-c452-465a-89f6-0f50e613f9d0', '2641fd06-387f-4d92-a322-accb8e180713', 'eaa21376-a54d-4245-95d6-a86dce6313c8', '34e489ad-2eca-4078-adb6-6d2b521b407e', '4f6b4985-2dc9-4ab6-ac79-d60f0860b0ac', '7479ef42-c1ac-4473-854e-5a5c35894e35', 'c1517b80-50ab-4733-8208-ae2c2765c0e7', '14f9834d-bc23-41a8-ab61-5c8abdbea505', 'c68e69d7-9317-428a-a615-cdf8fe5a2e06', 'abb7a62c-4823-4334-8d88-7d0f70473413', '93ba22b1-833e-47ba-ae94-8ee7b9eefa9a', 'b692705b-2f12-4a3d-ab4d-579124e0667c', 'e6e7bad9-d48d-4434-b334-7c651ffc4bdf', 'b1113b51-d27b-4941-a0d4-bc2826158464', '76e78c26-21c9-45b4-b84b-4c3e1f8ff763', 'b0c32d5a-754b-44c3-b265-b67acc7d0375', '818c3d9d-1831-48a6-9583-0364a7f98453', 'a8484031-f244-4661-9fb7-0932bd1ba872', '52dae4c7-2ab1-4bb9-ab1c-8100fd54e2f9', '3507a932-eace-46ea-bfe1-638ae819fa12', '80dedbac-9b9e-4fd0-98bb-da3df83d106a', '37cb4217-c710-4166-8e9f-352a61f2cd3a', '5756c2bf-36f8-4890-b1f9-ef168f1d8e9c', '67e940b7-aab2-46ce-a62b-c7308cde9de7', '8996a19c-8e8b-4d8b-8f1a-fa146751d544', 'bf3d6533-f318-41ff-bcf5-472363728b9c', 'e90f1b95-4825-4f3d-bbe2-4cbc82dc7229', '35000130-8f39-4171-aacf-90b41a95faa3', 'a7dc956b-41da-4eef-b414-56acae63d895', 'c8ea8e19-cae7-4683-9b62-cdbbed744784', '6c39354a-c52d-46d7-982c-b5d196988189', '4ffd33c9-e0d6-4cd6-bd13-34c266c79be0', '5a5fea94-4819-4a1d-b66d-9fd2179a7d1c', 'b9c27771-247a-459d-b751-85460d3fd5a2', '50cd4e99-04ee-427b-a3b4-da721ed05d9c', '77c92a27-f409-45fe-9747-4ca2455cd952', 'cd7ce855-0cfa-414e-8762-ed65ae036e04', '44f3a3fd-107e-49ac-bf74-c0383525b8ca', '2ff9871d-edd1-4112-84d8-fdde39c164d3', 'fff09eaf-17c3-446b-be32-8a0d47e4ccf1'
]

import concurrent.futures

def check_id(sid):
    try:
        req = urllib.request.Request(f"https://play.max.com/show/{sid}", headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        html = urllib.request.urlopen(req, timeout=3).read().decode('utf-8', errors='ignore')
        if 'big bang' in html.lower():
            return sid
    except:
        pass
    return None

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = executor.map(check_id, show_ids)
    for res in results:
        if res:
            print(f"FOUND SHOW ID: {res}")
            break
