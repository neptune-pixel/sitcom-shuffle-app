s3_mapped = {
  "S03E01": "70080635",
  "S03E02": "70080631",
  "S03E03": "70080633",
  "S03E04": "70080636",
  "S03E05": "70080637",
  "S03E06": "70080634",
  "S03E07": "70080628",
  "S03E08": "70080639",
  "S03E09": "70080632",
  "S03E10": "70080627"
}

used_nums = set(int(v) for v in s3_mapped.values())
all_nums = set(range(70080615, 70080650))
available = sorted(all_nums - used_nums)

print(f"Used numbers ({len(used_nums)}):", sorted(used_nums))
print(f"Available numbers in 70080615..70080649 ({len(available)}):", available)
