values:
  val1: 123
  val2: abc
  val3: true

steps:
- values:
    val1: 888
  script: |
    objects.push({ val1: values.val1 })
