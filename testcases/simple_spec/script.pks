values:
  val1: 123
  val2: abc
  val3: true

steps:
- script: |
    objects.push({ val1: values.val1 })
