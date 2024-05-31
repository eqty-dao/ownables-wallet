import { ReactComponent as Heart } from "../../assets/heart_icon.svg";
import { ReactComponent as HeartFilled } from "../../assets/heart_filled.svg";
import { useCollections } from "../../context/CollectionsContext";
import { StaticCollections } from "../../services/Collection.service";

const btnStyle = {
  border: "none",
  background: "none",
  paddingTop: "30px",
  paddingLeft: "0px",
  paddingBottom: "0px",
  paddingInline: "0px",
};

interface Props {
  packageName: string;
}

const FavoriteButton = (props: Props) => {
  const { addTo, findFrom, removeFrom } = useCollections();

  const isFavorite = findFrom(StaticCollections.FAVORITES, props.packageName);

  const toggleFavorite = () => {
    if (isFavorite) {
      removeFrom(StaticCollections.FAVORITES, props.packageName);
      return;
    }
    addTo(StaticCollections.FAVORITES, props.packageName);
  };

  return (
    <button onClick={toggleFavorite} style={btnStyle}>
      {isFavorite ? <HeartFilled /> : <Heart />}
    </button>
  );
};

export default FavoriteButton;
