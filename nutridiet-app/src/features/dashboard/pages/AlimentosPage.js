import Dashboard from '../Dashboard';
import FoodGrid from '../components/FoodGrid'; // 你刚刚写的
import Search from '../components/Search';


export default function AlimentosPage() {
  return (
    <Dashboard>
      <Search />
      
      <FoodGrid />
    </Dashboard>
  );
}
