import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart' )

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseProducts =  await api.get(`products/${productId}`)
      const responseStock =  await api.get(`stock/${productId}`)
      const product = responseProducts.data as Product
      const stock = responseStock.data as Stock
      const productInCart = cart.find(product => product.id === productId)

      if(!productInCart){
       if(stock.amount > 0){
         setCart([...cart, {...product, amount: 1}])
         localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {...product, amount: 1}]))
         toast.success('Produto adicionado com Sucesso!')
         return
       }
      }
      if(productInCart){
        if(stock.amount > productInCart.amount){
          const updatedCart = cart.map( cartItem => cartItem.id === productId ? 
          {...cartItem, 
            amount: cartItem.amount + 1
          
          }: cartItem)
          toast.success('Produto adicionado com Sucesso!')
          setCart(updatedCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
          return
        }else{
          toast.error('Quantidade solicitada fora de estoque')
          return
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.some( cartProduct => cartProduct.id === productId)

      if(!productExists){
        toast.error('Erro na remoção do produto');
        return
      }

      const  updatedCart = cart.filter( cartItem => cartItem.id !== productId)
     
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      toast.success('Produto removido com Sucesso!')

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 1){
        toast.error('Erro na alteração de quantidade do produto');
        return
      }
      const responseStock =  await api.get(`stock/${productId}`)
      const stockAmount = responseStock.data.amount
      const stockIsNotAvailable = amount > stockAmount
      if(stockIsNotAvailable){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      const productExists = cart.some( cartProduct => cartProduct.id === productId)
      if(!productExists){
        toast.error('Erro na alteração de quantidade do produto');
        return
      }

      const updatedCart = cart.map( cartItem => cartItem.id === productId ? 
        {...cartItem, 
          amount: amount
        
        }: cartItem)

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))


    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
