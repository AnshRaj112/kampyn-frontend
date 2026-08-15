import React, { useState } from 'react';
import Image from 'next/image';
import { FaHeart, FaRegHeart, FaTrash } from 'react-icons/fa';
import styles from './DishListItem.module.scss';
import { FoodItem } from '@/app/food/[slug]/types'; // Assuming types are exported here or similar path
import { getDishDescription, isDishInStock } from './dishListItemUtils';
import DishQuantityControls from './DishQuantityControls';

interface DishListItemProps {
    item: FoodItem;
    quantity: number;
    isLoading?: boolean;
    showActions?: boolean;
    isFavorite?: boolean;
    onAdd: (item: FoodItem) => void;
    onIncrease: (item: FoodItem) => void;
    onDecrease: (item: FoodItem) => void;
    onToggleFavorite?: (item: FoodItem) => void;
    variant?: 'default' | 'boxed' | 'cart';
    onRemove?: (item: FoodItem) => void;
}

const DishListItem: React.FC<DishListItemProps> = ({
    item,
    quantity,
    isLoading = false,
    showActions = true,
    isFavorite = false,
    onAdd,
    onIncrease,
    onDecrease,
    onToggleFavorite,
    variant = 'default',
    onRemove,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const { description, shouldTruncate, truncatedDescription } = getDishDescription(item);
    const displayDescription = isExpanded || !shouldTruncate ? description : truncatedDescription;
    const inStock = isDishInStock(item);

    const isBoxed = variant === 'boxed';
    const themeComponent =
        variant === 'cart' ? 'card.cartItem' : 'card.dish';

    return (
        <div
            className={`${styles.dishListItem} ${isBoxed ? styles.boxed : ''}`}
            data-theme-component={themeComponent}
        >
            <div className={styles.leftSection}>
                <div className={styles.imageContainer}>
                    <Image
                        src={item.image || '/images/placeholder_food.jpg'}
                        alt={item.title}
                        fill
                        style={{ objectFit: 'cover' }}
                    />
                </div>
                {item.collegeName && (
                    <span className={styles.collegeNameBadge}>{item.collegeName}</span>
                )}
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.titleRow}>
                        {item.isVeg !== undefined && item.isVeg !== null && (
                            <div className={`${styles.vegIndicator} ${String(item.isVeg).toLowerCase() === 'true' || String(item.isVeg).toLowerCase() === 'yes' || String(item.isVeg).toLowerCase() === 'veg' || item.isVeg === true ? styles.veg : styles.nonVeg}`}>
                                <div className={styles.dot}></div>
                            </div>
                        )}
                        <h3 className={styles.title}>{item.title}</h3>
                        {onToggleFavorite && (
                            <button
                                className={styles.favoriteBtn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(item);
                                }}
                            >
                                {isFavorite ? <FaHeart className={styles.heartIcon} /> : <FaRegHeart className={styles.heartIcon} />}
                            </button>
                        )}
                    </div>
                </div>


                {!isBoxed && (
                    <p className={styles.description}>
                        {displayDescription}
                        {shouldTruncate && (
                            <button
                                className={styles.readMoreBtn}
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            >
                                {isExpanded ? "Read Less" : "Read More"}
                            </button>
                        )}
                    </p>
                )}

                <div className={styles.footer}>
                    <div className={styles.priceSection}>
                        <div className={styles.price}>₹ {item.price}</div>
                    </div>
                    {showActions && (
                        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                            <DishQuantityControls
                                item={item}
                                quantity={quantity}
                                isLoading={isLoading}
                                inStock={inStock}
                                onAdd={onAdd}
                                onIncrease={onIncrease}
                                onDecrease={onDecrease}
                            />
                            {onRemove && (
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => onRemove(item)}
                                    disabled={isLoading}
                                >
                                    <FaTrash className={styles.trashIcon} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DishListItem;
