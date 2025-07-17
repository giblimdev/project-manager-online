/*
cette page utilisera les  composant avec les props appropriés: 
-DisplayWiew qui permer de chaoisir le made d'affichage liste, card, tree, kanban
-Itemfilter qui permet de filtrer les items par nom 
-ItemList qui permet d'afficher la liste des items selon le mode d'affichage (ve composant utilisera une composant par type de view) et propose un bouton ajouter 
et pour chaque item fleche up et down pour changer l'ordre des items (appel a une fonction utils séparé 
et réutilisable), edit (modifié utilise le Form specifique relatif a la table) et delete (fonction utils qui recois le nom de la table et l'id de l'item concerné).
le bouton ajouter ouvrira un modal avec le formullaire specifique pour ajouter un nouvel item 
(ce forme sera aussi utiliser pour édité un item).
 
*/

import React from "react";

function page() {
  return (
    <div className="m-10">
      {" "}
      {/* Work Hierarchy */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Hiérarchie du Travail
            </h2>
            <p className="text-xl text-gray-600">
              Organisation claire et structurée de vos projets
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Hierarchy Visual */}
              <div className="flex flex-col space-y-6">
                {/* Initiative */}
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded-full mr-4"></div>
                  <div className="flex-1 bg-gradient-to-r from-purple-100 to-purple-200 p-6 rounded-xl border border-purple-300">
                    <h3 className="text-xl font-semibold text-purple-800 mb-2">
                      Initiative
                    </h3>
                    <p className="text-purple-700">
                      Objectif business stratégique avec ROI et budget
                    </p>
                  </div>
                </div>

                {/* Epic */}
                <div className="flex items-center ml-8">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-4"></div>
                  <div className="flex-1 bg-gradient-to-r from-blue-100 to-blue-200 p-6 rounded-xl border border-blue-300">
                    <h3 className="text-xl font-semibold text-blue-800 mb-2">
                      Epic
                    </h3>
                    <p className="text-blue-700">
                      Ensemble de fonctionnalités liées à un domaine métier
                    </p>
                  </div>
                </div>

                {/* Feature */}
                <div className="flex items-center ml-16">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full mr-4"></div>
                  <div className="flex-1 bg-gradient-to-r from-emerald-100 to-emerald-200 p-6 rounded-xl border border-emerald-300">
                    <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                      Feature
                    </h3>
                    <p className="text-emerald-700">
                      Fonctionnalité avec critères d'acceptation et valeur
                      business
                    </p>
                  </div>
                </div>

                {/* User Story */}
                <div className="flex items-center ml-24">
                  <div className="w-4 h-4 bg-orange-500 rounded-full mr-4"></div>
                  <div className="flex-1 bg-gradient-to-r from-orange-100 to-orange-200 p-6 rounded-xl border border-orange-300">
                    <h3 className="text-xl font-semibold text-orange-800 mb-2">
                      User Story
                    </h3>
                    <p className="text-orange-700">
                      Besoin utilisateur avec estimation en story points
                    </p>
                  </div>
                </div>

                {/* Task */}
                <div className="flex items-center ml-32">
                  <div className="w-4 h-4 bg-pink-500 rounded-full mr-4"></div>
                  <div className="flex-1 bg-gradient-to-r from-pink-100 to-pink-200 p-6 rounded-xl border border-pink-300">
                    <h3 className="text-xl font-semibold text-pink-800 mb-2">
                      Task
                    </h3>
                    <p className="text-pink-700">
                      Tâche technique avec estimation en heures
                    </p>
                  </div>
                </div>
              </div>

              {/* Connecting lines */}
              <div className="absolute left-2 top-6 bottom-6 w-0.5 bg-gradient-to-b from-purple-400 via-blue-400 via-emerald-400 via-orange-400 to-pink-400"></div>
            </div>
          </div>
        </div>
      </section>
      <section>
        <div></div>
      </section>
    </div>
  );
}

export default page;
