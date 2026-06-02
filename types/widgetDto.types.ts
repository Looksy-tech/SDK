/**
 * Example PRODUCT_DATA message:
 *
 * {
 *   type: "PRODUCT_DATA",
 *   product: {
 *     image: "/upload/resize_cache/iblock/f1c/600_600_1/photo.jpg",
 *     name: "Боди кружево",
 *     price: "3 990 ₽",
 *     description: "Состав: п/э - 95%; эластан - 5%",
 *     external_id: "87618",
 *
 *     extendedProductData: {
 *       product_id: "87616",
 *       offer_id: "87618",
 *       variants: [
 *         {
 *           code: "P_SIZE",
 *           name: "Размер",
 *           type: "text",
 *           values: [
 *             { id: "46", name: "42 (S)", picture: null }
 *           ]
 *         },
 *         {
 *           code: "P_collor",
 *           name: "Цвет",
 *           type: "text",
 *           values: [
 *             { id: "234", name: "черный", picture: null }
 *           ]
 *         }
 *       ],
 *       selected: {
 *         P_SIZE: "46",
 *         P_collor: "234"
 *       }
 *     }
 *   }
 * }
 */

type TExtendedProductVariantValue = {
  id: string;
  name: string;
  picture?: string | null;
};

type TExtendedProductVariantProperty = {
  code: string;
  name: string;
  type?: string | null;
  values: TExtendedProductVariantValue[];
};

type TExtendedProductData = {
  product_id?: string;
  offer_id?: string;

  variants?: TExtendedProductVariantProperty[];
  selected?: Record<string, string>;

  raw?: unknown;
};

type TWidgetProductData = {
  image: string;
  name: string;
  price?: string;
  description?: string;
  external_id?: string;

  extendedProductData?: TExtendedProductData | null;
};

type TWidgetProductDataMessage = {
  type: "PRODUCT_DATA";
  product: TWidgetProductData;
};

type TPressAddToCartPayload = {
  product_id?: string;
  offer_id?: string;
  quantity?: number;
  selected?: Record<string, string>;
};

type TWidgetPressAddToCartMessage = {
  type: "PRESS_ADD_TO_CART_BTN";
  payload: TPressAddToCartPayload;
};

/**
 * Example future PRESS_ADD_TO_CART_BTN message:
 *
 * {
 *   type: "PRESS_ADD_TO_CART_BTN",
 *   payload: {
 *     product_id: "87616",
 *     offer_id: "87618",
 *     quantity: 1,
 *     selected: {
 *       P_SIZE: "46",
 *       P_collor: "234"
 *     }
 *   }
 * }
 */