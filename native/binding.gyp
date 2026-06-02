{
  "targets": [
    {
      "target_name": "avn_input",
      "sources": ["src/input.cc"],
      "include_dirs": ["<!@(node -p \"require('node-addon-api').include\")"],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        ["OS=='win'", { "libraries": ["user32.lib"] }]
      ]
    }
  ]
}
