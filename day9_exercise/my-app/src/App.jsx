function Greeting(props) {
  return <p>Hello {props.name}!</p>;
}

function App() {
  return (
    <>
      <Greeting name="John" />
      <Greeting name="Priya" />
    </>
  );
}

export default App;