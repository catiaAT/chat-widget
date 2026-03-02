import RasaChatbotWidget from "@rasahq/chat-widget-react";

function App() {
  return (
    <div>
      <RasaChatbotWidget
        serverUrl="https://assistant.dev.catiabot.pt"
        onChatWidgetOpened={console.log}
      />
    </div>
  );
}

export default App;
