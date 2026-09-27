# Triage labels

## Aktif sekarang: default

Lima peran kanonis, string label = namanya:

- `needs-triage` — baru masuk, belum disortir
- `needs-info` — butuh info tambahan sebelum bisa dikerjakan
- `ready-for-agent` — siap dikerjakan agen
- `ready-for-human` — butuh manusia (keputusan/akses/approval)
- `wontfix` — diputuskan tidak dikerjakan

Dipakai sebagaimana adanya sampai evaluasi memutuskan lain.

## Opsi evaluasi: custom Jira

Untuk evaluasi ke depan: petakan kelima peran di atas ke field/status Jira yang
sudah ada (mis. Status `To Do` ≈ `needs-triage`, label Jira `agent-ready` ≈
`ready-for-agent`). Syarat adopsi: (1) tak ada duplikasi makna, (2) transisi
didukung workflow Jira yang dipakai, (3) skill `triage` dikonfigurasi ulang
mengikuti mapping. Sampai diputuskan: **tetap default**.
