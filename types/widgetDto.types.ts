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
	id: string
	name: string
	picture?: string | null
}

type TExtendedProductVariantProperty = {
	code: string
	name: string
	type?: string | null
	values: TExtendedProductVariantValue[]
}

type TExtendedProductOfferPrice = {
	value: number
	display?: string | null
}

// One concrete SKU (offer) and the exact variant combination it represents.
// `values` maps each property code to the selected value id, e.g.
// { P_SIZE: "47", P_collor: "430" }. The widget matches the user's chosen
// combination against these to compute which offer_id to add.
type TExtendedProductOffer = {
	id: string
	values: Record<string, string>
	available: boolean
	price?: TExtendedProductOfferPrice | null
}

type TExtendedProductData = {
	product_id?: string

	variants?: TExtendedProductVariantProperty[]
	// Variant values of the initially selected offer, e.g.
	// { P_SIZE: "46", P_collor: "430" } — used to pre-select the UI.
	selected?: Record<string, string>

	// Full list of every offer with its variant combination, so the widget can
	// resolve the target offer_id itself and send it back in offer_id.
	offers?: TExtendedProductOffer[]
}

type TWidgetProductData = {
	image: string
	name: string
	price?: string
	description?: string
	external_id?: string

	extendedProductData?: TExtendedProductData | null
}

type TWidgetProductDataMessage = {
	type: 'PRODUCT_DATA'
	product: TWidgetProductData
}

// ---------------------------

// The widget resolves the chosen variant combination to a concrete offer
// (using extendedProductData.offers) and sends only that offer_id here.
// Quantity is always treated as 1 on the SDK side.
type TPressAddToCartPayload = {
	offer_id: string
}

type TWidgetPressAddToCartMessage = {
	source?: 'looksy-widget'
	type: 'PRESS_ADD_TO_CART_BTN'
	request_id: string
	payload: TPressAddToCartPayload
}

type TWidgetPressAddToCartResultMessage = {
	source?: 'looksy-sdk'
	type: 'PRESS_ADD_TO_CART_BTN_RESULT'
	request_id: string
	success: boolean
	message?: string
}

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
